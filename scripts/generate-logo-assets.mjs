import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const logoDir = join(publicDir, 'logo');
const src = join(logoDir, 'FV_logo.png');

async function generate() {
  const meta = await sharp(src).metadata();
  console.log(`Source: ${meta.width}x${meta.height}, hasAlpha: ${meta.hasAlpha}`);

  // Trim transparent edges to get tight crop
  const trimmed = sharp(src).trim();
  const trimmedBuf = await trimmed.toBuffer();
  const trimMeta = await sharp(trimmedBuf).metadata();
  console.log(`Trimmed: ${trimMeta.width}x${trimMeta.height}`);

  // Save trimmed dark version (original)
  await sharp(trimmedBuf).png().toFile(join(logoDir, 'tent-dark.png'));
  console.log('  tent-dark.png (trimmed original)');

  // Create white (inverted) version for dark backgrounds
  // Negate only RGB, preserve alpha
  await sharp(trimmedBuf).negate({ alpha: false }).png().toFile(join(logoDir, 'tent-white.png'));
  console.log('  tent-white.png (inverted for dark bg)');

  // Generate favicon PNGs from the actual logo
  // Favicon: white tent on dark rounded-corner square
  const faviconSize = 512;
  const padding = Math.round(faviconSize * 0.12);
  const tentSize = faviconSize - padding * 2;

  // Resize the white tent to fit inside the favicon
  const whiteTentBuf = await sharp(trimmedBuf)
    .negate({ alpha: false })
    .resize(tentSize, tentSize, { fit: 'inside' })
    .toBuffer();

  const whiteTentMeta = await sharp(whiteTentBuf).metadata();

  // Create dark background with rounded corners
  const roundedRect = Buffer.from(
    `<svg width="${faviconSize}" height="${faviconSize}">
      <rect width="${faviconSize}" height="${faviconSize}" rx="${Math.round(faviconSize * 0.18)}" fill="#111111"/>
    </svg>`
  );

  const faviconBase = await sharp(roundedRect)
    .resize(faviconSize, faviconSize)
    .png()
    .toBuffer();

  // Composite the white tent centered on the dark background
  const left = Math.round((faviconSize - whiteTentMeta.width) / 2);
  const top = Math.round((faviconSize - whiteTentMeta.height) / 2);

  const favicon512 = await sharp(faviconBase)
    .composite([{ input: whiteTentBuf, left, top }])
    .png()
    .toBuffer();

  await sharp(favicon512).toFile(join(publicDir, 'favicon-512x512.png'));
  console.log('  favicon-512x512.png');

  const sizes = [16, 32, 48, 96, 180, 192];
  for (const size of sizes) {
    await sharp(favicon512)
      .resize(size, size)
      .png()
      .toFile(join(publicDir, `favicon-${size}x${size}.png`));
    console.log(`  favicon-${size}x${size}.png`);
  }

  await sharp(favicon512).resize(180, 180).png().toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('  apple-touch-icon.png');

  await sharp(favicon512).resize(32, 32).png().toFile(join(publicDir, 'favicon.png'));
  console.log('  favicon.png');

  console.log('\nDone!');
}

generate().catch(console.error);
