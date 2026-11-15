# MagicPrintChile — sitio Astro

Migración de **magicprintchile.cl** desde OpenCart a un catálogo estático en **Astro 7**, listo para **Cloudflare Pages**.

- 115 productos y 40 categorías extraídos del OpenCart original (`data/raw-products.tsv`)
- Imágenes originales migradas y optimizadas (WebP en el repo → AVIF/WebP responsive en el build)
- Logo vectorial optimizado (`public/brand/*.svg`)
- Cotizador: el cliente arma su lista y la envía por **WhatsApp** o **correo** (sin backend)
- SEO: URLs limpias, sitemap, JSON-LD (Organization, Product, BreadcrumbList, FAQ), Open Graph
- **Redirecciones 301** desde las URLs antiguas `index.php?route=...` (Pages Function `functions/index.php.js`)

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # genera catalog.json + build estático en dist/
```

## Deploy en Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → **Connect to Git** → `gbrss/magicprintchile`
2. Framework preset: **Astro** · Build command: `npm run build` · Output: `dist`
3. Variable de entorno: `NODE_VERSION=22` (también está `.node-version`)
4. Agregar dominio personalizado `magicprintchile.cl` y `www.magicprintchile.cl`

> ⚠️ Antes de apuntar el DNS a Cloudflare, confirma que el workflow **"Migrar imágenes desde OpenCart"** terminó OK (las imágenes quedan guardadas en el repo). Después del cambio de DNS el OpenCart ya no estará accesible.

## Estructura

| Ruta | Qué es |
|---|---|
| `data/raw-products.tsv` | Catálogo fuente (id, categorías, código, nombre, imágenes, descripción) |
| `scripts/build-data.mjs` | Genera `src/data/catalog.json` y el mapa de redirecciones |
| `scripts/fetch-images.mjs` | Descarga y optimiza imágenes del sitio antiguo (lo corre GitHub Actions) |
| `scripts/logo/generate-logo.mjs` | Regenera el logo vectorial (texto en trazos) |
| `scripts/ornaments.mjs` | Genera las rosetas guilloché del diseño |
| `functions/index.php.js` | 301 desde URLs de OpenCart |

## Editar productos

Edita `data/raw-products.tsv` (separado por tabulaciones). Para un producto nuevo con foto propia, guarda la imagen como `src/assets/catalog/<id>-1.webp` y deja la columna `imgs` con un nombre de referencia.

## Pendientes sugeridos

- Agregar redes sociales (Instagram/Facebook) en `src/lib/site.ts` si existen
- Conectar Google Analytics / Meta Pixel (los eventos `add_to_quote` y `quote_submit` ya se envían a `dataLayer`)
- Verificar el dominio en Google Search Console y enviar `sitemap-index.xml`
