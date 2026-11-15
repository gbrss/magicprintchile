// Descarga TODAS las imágenes del OpenCart original (magicprintchile.cl), las optimiza y las guarda en src/assets.
// Intenta primero el archivo original (image/catalog/...) y si no existe usa la versión cacheada 500x500.
// Uso: node scripts/fetch-images.mjs [--force]
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = process.env.LEGACY_ORIGIN || 'https://magicprintchile.cl';
const force = process.argv.includes('--force');
const catalog = JSON.parse(readFileSync(resolve(root, 'src/data/catalog.json'), 'utf8'));

const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
const candidates = (src, cacheSize) => {
  const ext = extname(src);
  const base = src.slice(0, -ext.length);
  const list = [`${ORIGIN}/image/catalog/${enc(src)}`];
  for (const e of [ext, ext.toLowerCase(), ext.toUpperCase()]) list.push(`${ORIGIN}/image/catalog/${enc(base + e)}`);
  list.push(`${ORIGIN}/image/cache/catalog/${enc(base)}-${cacheSize}${ext}`);
  list.push(`${ORIGIN}/image/cache/catalog/${enc(base)}-500x500${ext}`);
  return [...new Set(list)];
};

async function download(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (migracion magicprintchile)' } });
      const type = res.headers.get('content-type') || '';
      if (res.ok && type.startsWith('image/')) return { buf: Buffer.from(await res.arrayBuffer()), url };
    } catch {}
  }
  return null;
}

async function save(buf, file, { max = 1600, flatten = true } = {}) {
  let img = sharp(buf, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  if (flatten && !meta.hasAlpha) img = img.flatten({ background: '#ffffff' });
  img = img.resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true });
  await img.webp({ quality: 86, effort: 6, alphaQuality: 90 }).toFile(file);
  return meta;
}

const report = { ok: [], fallback: [], missing: [] };
async function job(src, file, cacheSize, opts) {
  if (!force && existsSync(file)) return;
  const got = await download(candidates(src, cacheSize));
  if (!got) return report.missing.push(src);
  await save(got.buf, file, opts);
  (got.url.includes('/cache/') ? report.fallback : report.ok).push(src);
}

const tasks = [];
mkdirSync(resolve(root, 'src/assets/catalog'), { recursive: true });
mkdirSync(resolve(root, 'src/assets/banners'), { recursive: true });
mkdirSync(resolve(root, 'src/assets/brand'), { recursive: true });

for (const p of catalog.products)
  p.sources.forEach((src, i) => tasks.push(() => job(src, resolve(root, `src/assets/catalog/${p.images[i]}.webp`), '500x500')));
for (const b of catalog.banners)
  tasks.push(() => job(b.source, resolve(root, `src/assets/banners/${b.id}.webp`), '1140x380', { max: 2000 }));
tasks.push(async () => {
  const file = resolve(root, 'src/assets/brand/logo-original.png');
  if (!force && existsSync(file)) return;
  const got = await download([`${ORIGIN}/image/catalog/logos/magicprintchile_logo.png`]);
  if (got) await sharp(got.buf).trim().png({ compressionLevel: 9, palette: true }).toFile(file);
});

// 6 descargas en paralelo para no saturar el hosting antiguo
const queue = [...tasks];
await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await queue.shift()(); }));

writeFileSync(resolve(root, 'data/images-report.json'), JSON.stringify(report, null, 1));
console.log(`originales: ${report.ok.length} · desde caché 500px: ${report.fallback.length} · faltantes: ${report.missing.length}`);
if (report.missing.length) console.log('Faltantes:\n' + report.missing.join('\n'));
