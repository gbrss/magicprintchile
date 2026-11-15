// Convierte data/raw-products.tsv (extraído del OpenCart original) en src/data/catalog.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/n°|nº/g, 'n')
    .replace(/×/g, 'x')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

// Categorías del OpenCart (path => datos). "legacy" = path original para redirecciones 301.
const categories = [
  { path: '106', slug: 'linea-institucional', name: 'Defensa y Seguridad', short: 'Institucional', blurb: 'Galvanos, escudos, bustos, monedas y regalos protocolares para Armada, Ejército, Fuerza Aérea y Carabineros.' },
  { path: '106_107', slug: 'infanteria-de-marina', name: 'Infantería de Marina', blurb: 'Escudos de bronce fundido y resina para batallones, destacamentos y unidades IM.' },
  { path: '106_111', slug: 'litoral', name: 'Litoral', blurb: 'Galvanos con piocha de bronce, cristales, cofres, remos y portasables para la Dirección del Litoral.' },
  { path: '106_110', slug: 'ejercito', name: 'Ejército', blurb: 'Galvanos de resina bronce envejecido, bustos, cofres para gallardete y llaveros institucionales.' },
  { path: '106_108', slug: 'fuerza-aerea', name: 'Fuerza Aérea', blurb: 'Galvanos de bronce, bustos de piloto, termos grabados y tazones con grados.' },
  { path: '106_109', slug: 'carabineros', name: 'Carabineros', blurb: 'Monedas, herretes, galvanos 3D y llaveros para unidades de Carabineros de Chile.' },
  { path: '106_112', slug: 'fraternidad-de-la-costa', name: 'Fraternidad de la Costa', blurb: 'Piezas náuticas y galvanos para la Hermandad de la Costa.' },
  { path: '65', slug: 'galvanos', name: 'Galvanos', short: 'Galvanos', blurb: 'Galvanos de bronce, cristal, metal y grabado láser para reconocimientos, aniversarios y ceremonias.' },
  { path: '65_68', slug: 'galvanos-de-bronce', name: 'Galvanos de bronce', blurb: 'Fundición en bronce sobre maderas nobles.' },
  { path: '65_66', slug: 'galvanos-de-cristal', name: 'Galvanos de cristal y acrílico', blurb: 'Cristal y acrílico grabado, elegantes y livianos.' },
  { path: '65_67', slug: 'galvanos-de-metal', name: 'Galvanos de metal', blurb: 'Impresión full color en placas metálicas dorada, plateada y blanca.' },
  { path: '65_69', slug: 'galvanos-laser', name: 'Galvanos en láser', blurb: 'Grabado láser sobre raulí, MDF y placas.' },
  { path: '104', slug: 'monedas', name: 'Monedas conmemorativas', short: 'Monedas', blurb: 'Challenge coins y monedas institucionales acuñadas, con caja.' },
  { path: '77', slug: 'tazones', name: 'Tazones', short: 'Tazones', blurb: 'Tazones sublimados blancos, dorados, plateados y mágicos, con caja.' },
  { path: '77_96', slug: 'tazones-publicitarios', name: 'Tazones publicitarios', blurb: 'Tu logo o diseño sublimado.' },
  { path: '77_97', slug: 'tazones-insumos', name: 'Tazones insumos', blurb: 'Tazones con Polycoat para sublimar.' },
  { path: '59', slug: 'poleras', name: 'Poleras', short: 'Poleras', blurb: 'Poleras de algodón y dry fit estampadas con tu diseño.' },
  { path: '59_93', slug: 'poleras-publicitarias', name: 'Poleras publicitarias', blurb: 'Estampado para empresas, eventos y equipos.' },
  { path: '59_92', slug: 'poleras-insumos', name: 'Poleras insumos', blurb: 'Poleras para sublimar y estampar.' },
  { path: '60', slug: 'polerones', name: 'Polerones', short: 'Polerones', blurb: 'Polerones y micropolar bordados o estampados.' },
  { path: '60_95', slug: 'polerones-publicitarios', name: 'Polerones publicitarios', blurb: 'Con tu marca bordada o estampada.' },
  { path: '60_94', slug: 'polerones-insumos', name: 'Polerones insumos', blurb: 'Polerones lisos para personalizar.' },
  { path: '71', slug: 'gorros', name: 'Gorros bordados', short: 'Gorros', blurb: 'Jockeys bordados en denim, cuero y gabardina.' },
  { path: '71_83', slug: 'gorros-publicitarios', name: 'Gorros publicitarios', blurb: 'Bordado de logos e insignias.' },
  { path: '71_82', slug: 'gorros-insumos', name: 'Gorros insumos', blurb: 'Jockeys lisos para bordar.' },
  { path: '98', slug: 'chapitas', name: 'Chapitas', short: 'Chapitas', blurb: 'Chapitas publicitarias, máquinas e insumos para chapas americanas.' },
  { path: '98_100', slug: 'chapitas-publicitarias', name: 'Chapitas publicitarias', blurb: 'Chapitas con tu diseño.' },
  { path: '98_99', slug: 'chapitas-insumos', name: 'Chapitas insumos', blurb: 'Insumos de 32 a 75 mm.' },
  { path: '74', slug: 'llaveros', name: 'Llaveros', short: 'Llaveros', blurb: 'Llaveros metálicos, acrílicos y lanyards personalizados.' },
  { path: '74_88', slug: 'llaveros-publicitarios', name: 'Llaveros publicitarios', blurb: 'Llaveros con tu marca.' },
  { path: '74_89', slug: 'llaveros-insumos', name: 'Llaveros insumos', blurb: 'Llaveros para personalizar.' },
  { path: '73', slug: 'lapices', name: 'Lápices', short: 'Lápices', blurb: 'Lápices publicitarios grabados o impresos.' },
  { path: '73_86', slug: 'lapices-publicitarios', name: 'Lápices publicitarios', blurb: 'Con tu logo.' },
  { path: '73_87', slug: 'lapices-insumos', name: 'Lápices insumos', blurb: 'Lápices para personalizar.' },
  { path: '63', slug: 'choperos', name: 'Choperos', short: 'Choperos', blurb: 'Choperos de vidrio y cerámica personalizados.' },
  { path: '63_79', slug: 'choperos-publicitarios', name: 'Choperos publicitarios', blurb: 'Con tu diseño.' },
  { path: '63_78', slug: 'choperos-insumos', name: 'Choperos insumos', blurb: 'Choperos para sublimar.' },
  { path: '76', slug: 'relojes', name: 'Relojes', short: 'Relojes', blurb: 'Relojes de madera personalizados.' },
  { path: '62', slug: 'calendarios', name: 'Calendarios', short: 'Calendarios', blurb: 'Calendarios personalizados para empresas e instituciones.' },
  { path: '61', slug: 'promocionales', name: 'Promocionales y ofertas', short: 'Promocionales', blurb: 'Balones, libretas ecológicas, lanyards, canastos y textiles para regalos corporativos.' },
];

const byPath = Object.fromEntries(categories.map((c) => [c.path, c]));
for (const c of categories) {
  c.parent = c.path.includes('_') ? byPath[c.path.split('_')[0]].slug : null;
}

const lines = readFileSync(resolve(root, 'data/raw-products.tsv'), 'utf8').trim().split('\n').slice(1);
const used = new Set();
const products = lines.map((line) => {
  const [id, cats, code, name, imgs, desc = ''] = line.split('\t');
  let slug = slugify(name);
  if (used.has(slug)) slug = `${slug}-${id}`;
  used.add(slug);
  const paths = cats.trim().split(/\s+/);
  // agregar categoría padre si sólo tiene subcategoría
  for (const p of [...paths]) if (p.includes('_') && !paths.includes(p.split('_')[0])) paths.push(p.split('_')[0]);
  const catSlugs = paths.map((p) => byPath[p]?.slug).filter(Boolean);
  const primary = byPath[paths.find((p) => !p.includes('_'))] ?? byPath[paths[0]];
  return {
    id: Number(id),
    slug,
    name: name.trim(),
    code: code.trim() || null,
    description: desc.trim() || null,
    categories: catSlugs,
    primary: primary.slug,
    sources: imgs.split(';').map((s) => s.trim()).filter(Boolean),
    images: imgs.split(';').filter(Boolean).map((_, i) => `${id}-${i + 1}`),
  };
});

for (const c of categories) c.count = products.filter((p) => p.categories.includes(c.slug)).length;

const banners = [
  ['Campanas.png', 'Decoración náutica: campanas de bronce'],
  ['NAUTICA 3.png', 'Decoración náutica: relojes'],
  ['DECORACION NAUTICA.png', 'Decoración náutica'],
  ['DECORACION NAUTICA 2.png', 'Decoración náutica: timones'],
  ['85253412_10220856886707825_1288360699830992896_o.jpg', 'Salmos impresos'],
  ['proyecto de estampados de tazones.png', 'Proyecto de estampado de tazones'],
  ['maderas mdf 8 tamaños.png', 'Maderas MDF importadas de EE.UU.'],
  ['banner.png', 'Impresión en metales'],
  ['galvano especial.jpg', 'Galvanos especiales con campana'],
  ['Chapas.jpg', 'Máquinas de chapitas e insumos'],
  ['banner 1.jpg', 'Máquina para cortar metales'],
  ['placas de sublimacion 2.jpg', 'Placas de sublimación 60×40 cm'],
  ['galvanos de buques navales.jpg', 'Galvanos en metales de buques navales'],
  ['fundicion anclote im.jpg', 'Fundición: productos en bronce'],
  ['baner de moneda.jpg', 'Monedas conmemorativas'],
  ['general carrera.png', 'Galvanos Capitanía de Puerto'],
  ['productos/chapitas/armada de chile chapas.jpg', 'Chapitas Armada de Chile'],
  ['48426583_2002134516531127_2992719008395952128_n.jpg', 'Copas impresas en láser'],
  ['ssssss.png', 'Pack polera, gorro, banderín y caja'],
  ['VINILOS POLITAPE.png', 'Servicio de plotter de corte'],
  ['india mike.jpg', 'Galvanos institucionales'],
  ['MUSEO MARITIMO BT.png', 'Tazones Museo Marítimo'],
  ['categorias/4834467.jpg', 'Polerones'],
].map(([source, alt], i) => ({ id: `b-${i + 1}`, source, alt }));

// Mapa de redirecciones 301 desde URLs OpenCart (index.php?route=...) → usado por functions/index.php.js
const visible = (c) => {
  if (!c.parent) return true;
  const parent = categories.find((x) => x.slug === c.parent);
  return c.count > 0 && c.count < parent.count;
};
const legacy = {
  cats: Object.fromEntries(categories.map((c) => [c.path, `/categoria/${visible(c) ? c.slug : c.parent}/`])),
  prods: Object.fromEntries(products.map((p) => [p.id, `/producto/${p.slug}/`])),
};
mkdirSync(resolve(root, 'functions'), { recursive: true });
writeFileSync(resolve(root, 'functions/_legacy-map.json'), JSON.stringify(legacy));

const out = { generated: new Date().toISOString().slice(0, 10), categories, products, banners };
mkdirSync(resolve(root, 'src/data'), { recursive: true });
writeFileSync(resolve(root, 'src/data/catalog.json'), JSON.stringify(out, null, 1));
console.log(`catalog.json: ${products.length} productos, ${categories.length} categorías, ${banners.length} banners`);
