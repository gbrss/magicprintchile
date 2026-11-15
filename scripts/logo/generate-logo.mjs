// Genera el logo vectorial optimizado (texto convertido a trazos) a partir de Archivo 800.
// Requiere opentype.js y @fontsource/archivo (dev): node scripts/logo/generate-logo.mjs <ruta node_modules>
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const nm = process.argv[2] || resolve(root, 'node_modules');
const require = createRequire(resolve(nm, 'x.js'));
const opentype = require('opentype.js');
const buf = readFileSync(resolve(nm, '@fontsource/archivo/files/archivo-latin-800-normal.woff'));
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
delete font.tables.gsub;

const C = { navy: '#0B1F7A', red: '#E1251B', cyan: '#1FB2E8', white: '#FFFFFF' };

// Ícono: vela de franjas + olas (reinterpretación limpia del logo original)
const icon = (navy = C.navy, cyan = C.cyan) => {
  const bands = [
    [8, 7], [18, 7], [28, 8], [39, 8], [50, 9], [62, 10],
  ];
  const clip = `<clipPath id="sail"><path d="M66 4 L66 76 L8 76 Z"/></clipPath>`;
  const stripes = bands.map(([y, h]) => `<rect x="0" y="${y}" width="70" height="${h}" rx="1.5"/>`).join('');
  return `<defs>${clip}</defs>
  <g fill="${navy}" clip-path="url(#sail)" transform="skewX(-8) translate(10 0)">${stripes}</g>
  <rect x="70" y="2" width="4.5" height="76" rx="2.2" fill="${navy}"/>
  <g fill="${cyan}">
    <path d="M2 84 C 28 74, 62 74, 98 80 C 66 79, 34 82, 6 92 Z"/>
    <path d="M10 95 C 36 86, 70 86, 100 92 C 70 91, 42 94, 16 102 Z" opacity=".75"/>
    <path d="M20 105 C 44 98, 72 98, 98 103 C 72 103, 48 105, 28 112 Z" opacity=".5"/>
  </g>`;
};

const word = (text, x, y, size, fill) => {
  const p = font.getPath(text, x, y, size, { kerning: true, features: { liga: false, rlig: false, ccmp: false } });
  const w = font.getAdvanceWidth(text, size, { kerning: true, features: { liga: false, rlig: false, ccmp: false } });
  return { d: `<path fill="${fill}" d="${p.toPathData(2)}"/>`, w };
};

function wordmark(x, y, size, colors) {
  const a = word('Magic', x, y, size, colors.magic);
  const b = word('Print', x + a.w - size * 0.01, y, size, colors.print);
  const c = word('Chile', x + a.w + b.w - size * 0.02, y, size, colors.chile);
  const total = a.w + b.w + c.w - size * 0.03;
  // "M.R." marca registrada
  const mr = `<g transform="translate(${x + total + 4} ${y - size * 0.78})"><circle r="${size * 0.13}" cx="${size * 0.13}" cy="${size * 0.13}" fill="none" stroke="${colors.magic}" stroke-width="1.6"/><text x="${size * 0.13}" y="${size * 0.165}" font-family="Arial,sans-serif" font-size="${size * 0.1}" font-weight="700" text-anchor="middle" fill="${colors.magic}">MR</text></g>`;
  return { svg: a.d + b.d + c.d + mr, w: total + size * 0.3 };
}

const out = (name, svg) => {
  for (const dir of ['public/brand', 'src/assets/brand']) {
    mkdirSync(resolve(root, dir), { recursive: true });
    writeFileSync(resolve(root, dir, name), svg);
  }
};

// Horizontal a color
{
  const wm = wordmark(108, 74, 64, { magic: C.red, print: C.navy, chile: C.navy });
  const W = Math.ceil(108 + wm.w + 4);
  out('logo.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 116" role="img" aria-label="MagicPrintChile"><title>MagicPrintChile</title>${icon()}${wm.svg}</svg>`);
}
// Horizontal blanco (fondos oscuros)
{
  const wm = wordmark(108, 74, 64, { magic: '#FF4A3D', print: C.white, chile: C.white });
  const W = Math.ceil(108 + wm.w + 4);
  out('logo-white.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 116" role="img" aria-label="MagicPrintChile"><title>MagicPrintChile</title>${icon(C.white, C.cyan)}${wm.svg}</svg>`);
}
// Ícono solo
out('icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -2 112 118" role="img" aria-label="MagicPrintChile"><title>MagicPrintChile</title>${icon()}</svg>`);
// Favicon (fondo marfil redondeado para legibilidad en pestañas oscuras)
out('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#F6F2E9"/><g transform="translate(12 6)">${icon()}</g></svg>`);
console.log('logos generados');
