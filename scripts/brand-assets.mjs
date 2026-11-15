// Genera favicon.ico, apple-touch-icon, íconos PWA y og.jpg desde los SVG del logo
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => resolve(root, 'public', p);

const fav = readFileSync(pub('brand/favicon.svg'));
await sharp(fav, { density: 400 }).resize(180).png().toFile(pub('apple-touch-icon.png'));
await sharp(fav, { density: 400 }).resize(192).png().toFile(pub('brand/icon-192.png'));
await sharp(fav, { density: 600 }).resize(512).png().toFile(pub('brand/icon-512.png'));
// favicon.ico (PNG embebido, 32px)
const png32 = await sharp(fav, { density: 200 }).resize(32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(png32.length, 14); header.writeUInt32LE(22, 18);
writeFileSync(pub('favicon.ico'), Buffer.concat([header, png32]));

// og.jpg 1200x630
const logo = await sharp(readFileSync(pub('brand/logo-white.svg')), { density: 300 }).resize({ width: 640 }).png().toBuffer();
const ros = await sharp(readFileSync(pub('ornaments/rosette-brass.svg')), { density: 150 }).resize(620).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#0a1033' } })
  .composite([
    { input: ros, left: 700, top: 5 },
    { input: logo, left: 80, top: 250 },
    { input: Buffer.from('<svg width="1200" height="630"><rect x="80" y="420" width="120" height="6" fill="#e1251b"/></svg>'), left: 0, top: 0 },
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(pub('og.jpg'));
console.log('assets de marca listos');
