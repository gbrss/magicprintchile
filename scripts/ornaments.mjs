// Genera rosetas tipo guilloché (como en monedas y billetes) para el diseño: public/ornaments/*.svg
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'public/ornaments');
mkdirSync(dir, { recursive: true });

function rosette({ size = 600, rings, stroke, width = 0.6, opacity = 1 }) {
  const c = size / 2;
  const paths = [];
  for (const { R, A, n, m, count, pts = 400 } of rings) {
    for (let k = 0; k < count; k++) {
      const phase = (k / count) * Math.PI * 2;
      let d = '';
      for (let i = 0; i <= pts; i++) {
        const t = (i / pts) * Math.PI * 2;
        const r = R + A * Math.sin(n * t + phase) * (0.75 + 0.25 * Math.cos(m * t));
        const x = c + r * Math.cos(t);
        const y = c + r * Math.sin(t);
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      paths.push(`<path d="${d}Z"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><g fill="none" stroke="${stroke}" stroke-width="${width}" stroke-opacity="${opacity}">${paths.join('')}</g></svg>`;
}

const rings = [
  { R: 250, A: 26, n: 36, m: 6, count: 6 },
  { R: 180, A: 34, n: 24, m: 4, count: 7 },
  { R: 108, A: 30, n: 16, m: 3, count: 6 },
];
writeFileSync(resolve(dir, 'rosette-brass.svg'), rosette({ rings, stroke: '#c9974a', width: 0.7 }));
writeFileSync(resolve(dir, 'rosette-ink.svg'), rosette({ rings, stroke: '#0a1033', width: 0.55, opacity: 0.55 }));
writeFileSync(resolve(dir, 'rosette-paper.svg'), rosette({ rings, stroke: '#f6f2e9', width: 0.55, opacity: 0.5 }));
console.log('ornamentos generados');
