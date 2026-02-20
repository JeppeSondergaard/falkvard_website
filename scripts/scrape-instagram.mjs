import https from 'https';
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const galleryDir = join(root, 'public', 'gallery');
const rawDir = join(galleryDir, '_raw');
const dataDir = join(root, 'src', 'data');
mkdirSync(rawDir, { recursive: true });
mkdirSync(dataDir, { recursive: true });

const USER_ID = '7123840303';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-IG-App-ID': '936619743392459',
  'X-Requested-With': 'XMLHttpRequest',
  'Accept': '*/*',
  'Referer': 'https://www.instagram.com/a_falkvard_tattoo/',
};

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: HEADERS }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, filepath).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => { writeFileSync(filepath, Buffer.concat(chunks)); resolve(); });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getBestImageUrl(item) {
  if (item.image_versions2?.candidates?.length) {
    const sorted = item.image_versions2.candidates.sort((a, b) => b.width - a.width);
    return sorted[0].url;
  }
  if (item.carousel_media?.length) {
    const first = item.carousel_media[0];
    if (first.image_versions2?.candidates?.length) {
      return first.image_versions2.candidates.sort((a, b) => b.width - a.width)[0].url;
    }
  }
  return null;
}

async function fetchAllPosts() {
  console.log('=== Fetching @a_falkvard_tattoo posts via v1 API ===\n');

  const profileUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=a_falkvard_tattoo`;
  const profileData = await fetchJSON(profileUrl);
  const user = profileData.data.user;
  console.log(`Bio: ${user.biography}`);
  console.log(`Total posts: ${user.edge_owner_to_timeline_media.count}\n`);

  const allItems = [];
  let maxId = '';
  let page = 0;

  while (true) {
    page++;
    const url = `https://www.instagram.com/api/v1/feed/user/${USER_ID}/?count=33${maxId ? '&max_id=' + maxId : ''}`;

    try {
      const data = await fetchJSON(url);
      const items = data.items || [];
      console.log(`Page ${page}: ${items.length} items`);
      allItems.push(...items);

      if (!data.more_available || !data.next_max_id) break;
      maxId = data.next_max_id;
      await sleep(2000);
    } catch (err) {
      console.log(`  Stopped at page ${page}: ${err.message}`);
      break;
    }
  }

  console.log(`\nTotal items fetched: ${allItems.length}`);
  return { allItems, bio: user.biography, fullName: user.full_name };
}

async function downloadImages(posts) {
  const imagePosts = posts.filter(p => p.imageUrl);
  console.log(`\n=== Downloading ${imagePosts.length} images ===\n`);

  let downloaded = 0;
  let skipped = 0;
  for (const post of imagePosts) {
    const filepath = join(rawDir, post.localFile);
    if (existsSync(filepath)) { skipped++; continue; }

    try {
      await downloadFile(post.imageUrl, filepath);
      downloaded++;
      if (downloaded % 20 === 0) console.log(`  Downloaded ${downloaded}...`);
      await sleep(200);
    } catch (err) {
      console.error(`  FAILED ${post.localFile}: ${err.message}`);
    }
  }

  console.log(`Downloaded ${downloaded} new images, ${skipped} cached`);
}

function classifyPost(post) {
  const text = (post.caption + ' ' + (post.hashtags || []).join(' ')).toLowerCase();

  const tattooStrong = [
    'tattoo', 'tatovering', 'tatovør', 'tatoveringer', 'inked',
    'afalkvardtattoo', 'svendborgtattoo', 'tatovørsvendborg',
    'coverup', 'healed', 'fresh ink', 'nål', 'needle',
  ];
  const tattooMild = [
    'ink', 'custom', 'design', 'motiv', 'stencil', 'blackwork',
    'linework', 'dotwork', 'ornamental', 'nordisk', 'nordic',
  ];
  const nonTattoo = [
    'aftercare', 'iqaftercare', 'iqfoam', 'produkt', 'gavekort',
    'booking', 'booker du', 'åbningstider', 'walk-in piercing',
    'pris', 'heling', 'smerte', 'spontane tatoveringer',
    'tegner du ikke', 'hvad betyder',
  ];

  const styleMap = {
    'nordisk': ['nordic', 'nordisk', 'viking', 'norse', 'rune', 'nordictattoo'],
    'ornamental': ['ornamental', 'mandala', 'geometric', 'henna', 'mehndi', 'filigree', 'ornamentaltattoo'],
    'dark-art': ['dark art', 'darkart', 'skull', 'death', 'gothic', 'horror', 'witch', 'occult', 'demon', 'snake', 'moth', 'skeleton'],
    'blomster': ['blomster', 'flower', 'floral', 'rose', 'peony', 'sunflower', 'botanical', 'leaf', 'blomst'],
    'blackwork': ['blackwork', 'black work', 'solid black', 'tribal', 'boldline'],
    'fineline': ['fineline', 'fine line', 'minimalist', 'minimal', 'tiny', 'delicate', 'small tattoo'],
  };

  const isNonTattoo = nonTattoo.some(kw => text.includes(kw));
  const isTattooStrong = tattooStrong.some(kw => text.includes(kw));
  const isTattooMild = tattooMild.some(kw => text.includes(kw));

  if (isNonTattoo && !isTattooStrong) {
    return { category: '_info', style: null };
  }

  if (isTattooStrong || isTattooMild || post.caption.length < 80) {
    let style = 'unsorted';
    for (const [s, keywords] of Object.entries(styleMap)) {
      if (keywords.some(kw => text.includes(kw))) { style = s; break; }
    }
    return { category: 'tattoo', style };
  }

  return { category: '_unsorted', style: null };
}

function organizeFiles(posts) {
  console.log('\n=== Organizing into folders ===\n');

  const folders = ['nordisk', 'ornamental', 'dark-art', 'blomster', 'blackwork', 'fineline', 'unsorted', '_info', '_unsorted'];
  for (const f of folders) mkdirSync(join(galleryDir, f), { recursive: true });

  let copied = 0;
  for (const post of posts) {
    if (!post.localFile || post.isVideo) continue;
    const src = join(rawDir, post.localFile);
    if (!existsSync(src)) continue;

    const folder = post.category === 'tattoo' ? (post.style || 'unsorted') : post.category;
    const dest = join(galleryDir, folder, post.localFile);
    if (!existsSync(dest)) {
      copyFileSync(src, dest);
      copied++;
    }
  }

  console.log(`Copied ${copied} images into category folders\n`);
  console.log('Folder structure:');
  for (const f of folders) {
    const dir = join(galleryDir, f);
    if (existsSync(dir)) {
      const files = readdirSync(dir).filter(f => f.endsWith('.jpg'));
      if (files.length > 0) console.log(`  gallery/${f}/: ${files.length} images`);
    }
  }
}

async function run() {
  const { allItems, bio, fullName } = await fetchAllPosts();

  const posts = [];
  for (const item of allItems) {
    const isVideo = item.media_type === 2;
    const code = item.code;
    const caption = item.caption?.text || '';
    const hashtags = caption.match(/#[a-zA-ZæøåÆØÅ0-9_]+/g) || [];
    const imageUrl = getBestImageUrl(item);
    const timestamp = item.taken_at;

    const post = {
      shortcode: code,
      isVideo,
      imageUrl,
      caption,
      hashtags,
      timestamp,
      likes: item.like_count || 0,
      mediaType: item.media_type,
      localFile: `${code}.jpg`,
    };

    const { category, style } = classifyPost(post);
    post.category = category;
    post.style = style;
    posts.push(post);
  }

  const imagePosts = posts.filter(p => !p.isVideo && p.imageUrl);
  console.log(`\nImage posts: ${imagePosts.length}, Videos: ${posts.length - imagePosts.length}`);

  await downloadImages(imagePosts);

  console.log('\n=== Classification results ===');
  const stats = {};
  for (const p of posts) {
    const key = p.isVideo ? 'video' : (p.category === 'tattoo' ? `tattoo/${p.style}` : p.category);
    stats[key] = (stats[key] || 0) + 1;
  }
  for (const [k, v] of Object.entries(stats).sort()) console.log(`  ${k}: ${v}`);

  organizeFiles(imagePosts);

  const galleryData = imagePosts
    .filter(p => p.category === 'tattoo')
    .map(p => ({
      shortcode: p.shortcode,
      src: `/gallery/${p.style || 'unsorted'}/${p.localFile}`,
      caption: p.caption,
      hashtags: p.hashtags,
      style: p.style || 'unsorted',
      likes: p.likes,
      timestamp: p.timestamp,
    }));
  writeFileSync(join(dataDir, 'instagram-posts.json'), JSON.stringify(galleryData, null, 2));

  const captionText = posts
    .filter(p => p.caption)
    .map((p, i) => {
      const date = p.timestamp ? new Date(p.timestamp * 1000).toISOString().split('T')[0] : 'unknown';
      const tag = p.isVideo ? 'VIDEO' : (p.category === 'tattoo' ? `TATTOO/${p.style}` : p.category.toUpperCase());
      return `--- Post ${i + 1} (${p.shortcode}) [${date}] [${tag}] ---\n${p.caption}\n`;
    })
    .join('\n');
  writeFileSync(join(dataDir, 'instagram-captions.txt'), captionText);

  writeFileSync(join(dataDir, 'brand-voice.json'), JSON.stringify({
    fullName,
    bio,
    address: 'Ramsherred 1, 5700 Svendborg',
    toneNotes: [
      'Warm, personal, direct address to followers',
      'Uses 🖤 emoji frequently as signature',
      'Danish language, casual but professional',
      'Emphasizes trust, safety, personal connection',
      'Private studio ethos - customer always comes first',
      'Mix of informational posts and tattoo showcases',
    ],
    commonPhrases: [
      'Det vigtigste for mig er, at du føler dig tryg, hørt og set',
      'Tatoveringer med sjæl',
      'Privat studie i trygge rammer',
      'Åbent efter aftale',
      'Nordisk, Ornamental, Dark Art, blomster',
      'Bedste hilsner, 🖤Andrea',
    ],
    styles: ['Nordisk', 'Ornamental', 'Dark Art', 'Blomster', 'Blackwork', 'Fineline'],
    hashtagGroups: {
      studio: ['#afalkvardtattoo', '#svendborgtattoo', '#tatovørsvendborg', '#privatstudio'],
      style: ['#nordictattoo', '#ornamentaltattoo', '#darkart', '#blackwork', '#fineline'],
      location: ['#svendborg', '#sydfyn', '#fyn', '#faaborg', '#nyborg', '#ringe', '#middelfart'],
      care: ['#iqaftercare', '#iqfoam', '#allergivenlig', '#hygiejnenitop'],
    },
  }, null, 2));

  console.log(`\n=== Done! ===`);
  console.log(`Total posts processed: ${posts.length}`);
  console.log(`Gallery images (tattoos): ${galleryData.length}`);
  console.log(`Captions: src/data/instagram-captions.txt`);
  console.log(`Gallery data: src/data/instagram-posts.json`);
  console.log(`Brand voice: src/data/brand-voice.json`);
}

run().catch(console.error);
