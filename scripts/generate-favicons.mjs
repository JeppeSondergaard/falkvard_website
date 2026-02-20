import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');

const faviconSvg = readFileSync(join(publicDir, 'favicon.svg'), 'utf-8');
const sizes = [16, 32, 48, 96, 180, 192, 512];

async function generate() {
  const buf = Buffer.from(faviconSvg);

  for (const size of sizes) {
    await sharp(buf, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(join(publicDir, `favicon-${size}x${size}.png`));
    console.log(`  favicon-${size}x${size}.png`);
  }

  await sharp(buf, { density: 300 })
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('  apple-touch-icon.png');

  await sharp(buf, { density: 300 })
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.png'));
  console.log('  favicon.png');

  console.log('\nDone!');
}

generate().catch(console.error);
