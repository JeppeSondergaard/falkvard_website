import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const galleryDir = join(__dirname, '..', 'public', 'gallery');
mkdirSync(galleryDir, { recursive: true });

const urls = [
  'https://scontent-cph2-1.cdninstagram.com/v/t51.2885-15/479758318_18302131819232304_6852656060097688549_n.jpg?stp=dst-jpg_e35_p640x640_sh0.08_tt6&_nc_ht=scontent-cph2-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFkeV4FnmpxegHhQXV4HpeQ5gjxPaBAZ_UONGXHxMVSQkT-PTrZYHH_8-aYxEj5lAhTgJBJfVC5PUQHwLo4Xa8T&_nc_ohc=ZrGcWj-K9-8Q7kNvwFrUeRS&_nc_gid=fLkBFho5T12EN127_fzv-Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AftHIThSfOoURSuYuabr5MpQ0Ul7j179R367unST8DblDw&oe=699E2D91&_nc_sid=8b3546',
  'https://scontent-cph2-1.cdninstagram.com/v/t51.2885-15/639736119_18347310400232304_6135487613768606568_n.jpg?stp=dst-jpg_e15_p640x640_tt6&_nc_ht=scontent-cph2-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFkeV4FnmpxegHhQXV4HpeQ5gjxPaBAZ_UONGXHxMVSQkT-PTrZYHH_8-aYxEj5lAhTgJBJfVC5PUQHwLo4Xa8T&_nc_ohc=PSjcb0OzkL8Q7kNvwGeSvzS&_nc_gid=fLkBFho5T12EN127_fzv-Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AftCpgKRW26ny796L747N8s5SXHN4aMmHvp7gsnRggEtKg&oe=699E4017&_nc_sid=8b3546',
  'https://scontent-cph2-1.cdninstagram.com/v/t51.2885-15/480367701_18302130955232304_1808403262966742031_n.jpg?stp=dst-jpg_e35_p640x640_sh0.08_tt6&_nc_ht=scontent-cph2-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFkeV4FnmpxegHhQXV4HpeQ5gjxPaBAZ_UONGXHxMVSQkT-PTrZYHH_8-aYxEj5lAhTgJBJfVC5PUQHwLo4Xa8T&_nc_ohc=Vh5fOzR4_NwQ7kNvwFQSy96&_nc_gid=fLkBFho5T12EN127_fzv-Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfvRP0lN28W2WM1kXRXzdVcTvLNoINBOPgSoll0FGbZmvg&oe=699E3AB7&_nc_sid=8b3546',
  'https://scontent-cph2-1.cdninstagram.com/v/t51.2885-15/553205470_18327367537232304_2398439576575996552_n.jpg?stp=dst-jpg_e15_p640x640_tt6&_nc_ht=scontent-cph2-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFkeV4FnmpxegHhQXV4HpeQ5gjxPaBAZ_UONGXHxMVSQkT-PTrZYHH_8-aYxEj5lAhTgJBJfVC5PUQHwLo4Xa8T&_nc_ohc=-ZSP9ci5OakQ7kNvwHdS5CE&_nc_gid=fLkBFho5T12EN127_fzv-Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Aftra78AnolsKfEvNuxm1cOf3OeZWEDDtPlgs4JLHeZICA&oe=699E1553&_nc_sid=8b3546',
  'https://scontent-cph2-1.cdninstagram.com/v/t51.2885-15/631508103_18346159030232304_7051943223372923375_n.jpg?stp=dst-jpg_e35_p640x640_sh0.08_tt6&_nc_ht=scontent-cph2-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFkeV4FnmpxegHhQXV4HpeQ5gjxPaBAZ_UONGXHxMVSQkT-PTrZYHH_8-aYxEj5lAhTgJBJfVC5PUQHwLo4Xa8T&_nc_ohc=Za1FxKo88bEQ7kNvwFZbte6&_nc_gid=fLkBFho5T12EN127_fzv-Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfvqLLBUZX_oENo95lTfzXvSQ7mQ4hOMIEOa0Ee-E_H5dg&oe=699E26D1&_nc_sid=8b3546',
  'https://scontent-cph2-1.cdninstagram.com/v/t51.2885-15/628296429_18345262429232304_1834595650079090547_n.jpg?stp=dst-jpg_e35_p640x640_sh0.08_tt6&_nc_ht=scontent-cph2-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFkeV4FnmpxegHhQXV4HpeQ5gjxPaBAZ_UONGXHxMVSQkT-PTrZYHH_8-aYxEj5lAhTgJBJfVC5PUQHwLo4Xa8T&_nc_ohc=BC8bpBoiTiAQ7kNvwG-O3Uu&_nc_gid=fLkBFho5T12EN127_fzv-Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfsRaei2fqa6G5OzZQ7E-MdBMiWezNtw2eyDAVR_wJ6ulA&oe=699E3DFB&_nc_sid=8b3546',
  'https://scontent-cph2-1.cdninstagram.com/v/t51.2885-15/627497065_18345275353232304_4649823611504201306_n.jpg?stp=dst-jpg_e15_p640x640_tt6&_nc_ht=scontent-cph2-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFkeV4FnmpxegHhQXV4HpeQ5gjxPaBAZ_UONGXHxMVSQkT-PTrZYHH_8-aYxEj5lAhTgJBJfVC5PUQHwLo4Xa8T&_nc_ohc=7KgzNNJ_htoQ7kNvwEiOdZ3&_nc_gid=fLkBFho5T12EN127_fzv-Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Afs0eVwBudOELvjpv63pE-YD_R95nWvhpwJVJ28G8LEF4Q&oe=699E3AE0&_nc_sid=8b3546',
  'https://scontent-cph2-1.cdninstagram.com/v/t51.2885-15/627676026_18345218080232304_989852471175129067_n.jpg?stp=dst-jpg_e15_p640x640_tt6&_nc_ht=scontent-cph2-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFkeV4FnmpxegHhQXV4HpeQ5gjxPaBAZ_UONGXHxMVSQkT-PTrZYHH_8-aYxEj5lAhTgJBJfVC5PUQHwLo4Xa8T&_nc_ohc=Idc8icphb90Q7kNvwEOr9PU&_nc_gid=fLkBFho5T12EN127_fzv-Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AftdroAjJVLPjQV21Sw3cVxKD-vKb4WZJi2NKzcOcvj3cQ&oe=699E36D1&_nc_sid=8b3546',
  'https://scontent-cph2-1.cdninstagram.com/v/t51.2885-15/627687822_18345216106232304_1440548670462608729_n.jpg?stp=dst-jpg_e35_p640x640_sh0.08_tt6&_nc_ht=scontent-cph2-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFkeV4FnmpxegHhQXV4HpeQ5gjxPaBAZ_UONGXHxMVSQkT-PTrZYHH_8-aYxEj5lAhTgJBJfVC5PUQHwLo4Xa8T&_nc_ohc=aiAFXEVtvfYQ7kNvwEer8yW&_nc_gid=fLkBFho5T12EN127_fzv-Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Afu5rRwqTBIYLRXyZIRGEPwP-wMKlc-tp66SXN3hGFMxHA&oe=699E1938&_nc_sid=8b3546',
  'https://scontent-cph2-1.cdninstagram.com/v/t51.2885-15/619604999_18342863131232304_6356462359594094511_n.jpg?stp=dst-jpg_e35_p640x640_sh0.08_tt6&_nc_ht=scontent-cph2-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFkeV4FnmpxegHhQXV4HpeQ5gjxPaBAZ_UONGXHxMVSQkT-PTrZYHH_8-aYxEj5lAhTgJBJfVC5PUQHwLo4Xa8T&_nc_ohc=FF44pGsDl-EQ7kNvwGx0ItK&_nc_gid=fLkBFho5T12EN127_fzv-Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfsZFr311--FdHerDJKLFgQjaN8I6pVlz8bo46o6XclH-Q&oe=699E247D&_nc_sid=8b3546',
  'https://scontent-cph2-1.cdninstagram.com/v/t51.2885-15/627480171_18345214039232304_6782580944636114785_n.jpg?stp=dst-jpg_e35_p640x640_sh0.08_tt6&_nc_ht=scontent-cph2-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFkeV4FnmpxegHhQXV4HpeQ5gjxPaBAZ_UONGXHxMVSQkT-PTrZYHH_8-aYxEj5lAhTgJBJfVC5PUQHwLo4Xa8T&_nc_ohc=36DYEnJ99AQQ7kNvwH1P2Kv&_nc_gid=fLkBFho5T12EN127_fzv-Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Afs_rB4X7h-s7DHez3RpXSh1qhkbaPY-oKxL17mNipVt9g&oe=699E0E9B&_nc_sid=8b3546',
  'https://scontent-cph2-1.cdninstagram.com/v/t51.2885-15/621822730_18343339903232304_5633913638130632513_n.jpg?stp=dst-jpg_e35_p640x640_sh0.08_tt6&_nc_ht=scontent-cph2-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFkeV4FnmpxegHhQXV4HpeQ5gjxPaBAZ_UONGXHxMVSQkT-PTrZYHH_8-aYxEj5lAhTgJBJfVC5PUQHwLo4Xa8T&_nc_ohc=uNbOkJtq8JQQ7kNvwHiVend&_nc_gid=fLkBFho5T12EN127_fzv-Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfuT00pOVCdENumpZ_0XyU7UASka2UGWh-5scyck__wmmw&oe=699E42C7&_nc_sid=8b3546',
];

function download(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, filepath).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        writeFileSync(filepath, Buffer.concat(chunks));
        resolve();
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  for (let i = 0; i < urls.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const filepath = join(galleryDir, `tattoo-${num}.jpg`);
    try {
      await download(urls[i], filepath);
      console.log(`  tattoo-${num}.jpg`);
    } catch (err) {
      console.error(`  FAILED tattoo-${num}.jpg: ${err.message}`);
    }
  }
  console.log('\nDone!');
}

run();
