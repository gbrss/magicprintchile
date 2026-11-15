import type { ImageMetadata } from 'astro';
import data from '../data/catalog.json';

export type Category = (typeof data.categories)[number] & { parent: string | null; short?: string };
export type Product = (typeof data.products)[number];

export const categories = data.categories as Category[];
export const products = data.products as Product[];
export const banners = data.banners;

const productImgs = import.meta.glob<{ default: ImageMetadata }>('/src/assets/catalog/*.webp', { eager: true });
const bannerImgs = import.meta.glob<{ default: ImageMetadata }>('/src/assets/banners/*.webp', { eager: true });

export const img = (key: string | undefined): ImageMetadata | undefined =>
  key ? productImgs[`/src/assets/catalog/${key}.webp`]?.default : undefined;
export const bannerImg = (id: string): ImageMetadata | undefined => bannerImgs[`/src/assets/banners/${id}.webp`]?.default;
export const bannerBySource = (source: string) => {
  const b = banners.find((x) => x.source === source);
  return b ? { ...b, image: bannerImg(b.id) } : undefined;
};

export const catBySlug = (slug: string) => categories.find((c) => c.slug === slug);
export const topCategories = categories.filter((c) => !c.parent);
export const childrenOf = (slug: string) => categories.filter((c) => c.parent === slug);

/** Subcategorías que aportan algo (no vacías y distintas del padre) */
export const visibleChildren = (slug: string) => {
  const parent = catBySlug(slug);
  return childrenOf(slug).filter((c) => c.count > 0 && parent && c.count < parent.count);
};
/** Categorías que tienen página propia */
export const pageCategories = categories.filter((c) => !c.parent || visibleChildren(c.parent).some((v) => v.slug === c.slug));

export const productsIn = (slug: string) => products.filter((p) => p.categories.includes(slug));
export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const byIds = (ids: number[]) => ids.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];

export const INSTITUTIONAL = ['infanteria-de-marina', 'litoral', 'ejercito', 'fuerza-aerea', 'carabineros'];
export const CORPORATE = ['tazones', 'poleras', 'polerones', 'gorros', 'chapitas', 'llaveros', 'lapices', 'choperos', 'calendarios', 'relojes', 'promocionales'];

export const productBlurb = (p: Product) => {
  if (p.description) return p.description;
  const cat = catBySlug(p.categories.find((c) => c.includes('-')) ?? p.primary) ?? catBySlug(p.primary);
  return `${p.name}. ${cat?.blurb ?? ''} Pieza personalizable: cotiza indicando cantidad, medidas y tu logo o diseño.`.trim();
};
