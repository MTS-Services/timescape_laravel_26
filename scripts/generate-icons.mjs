import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, '../public/logo.png'); // change to logo.svg if preferred
const OUTPUT_DIR = resolve(__dirname, '../public/icons');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
}

for (const size of SIZES) {
    await sharp(SOURCE)
        .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }, // transparent bg
        })
        .png()
        .toFile(`${OUTPUT_DIR}/icon-${size}x${size}.png`);

    console.log(`✅ Generated icon-${size}x${size}.png`);
}

console.log('\n🎉 All icons generated in public/icons/');