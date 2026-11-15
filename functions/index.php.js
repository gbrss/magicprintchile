// Redirecciones 301 desde las URLs del OpenCart antiguo (index.php?route=...) a las nuevas rutas de Astro.
import map from './_legacy-map.json';

const INFO = { 4: '/nosotros/', 6: '/contacto/', 3: '/privacidad/', 5: '/privacidad/' };

export function onRequest({ request }) {
  const url = new URL(request.url);
  const q = url.searchParams;
  const route = q.get('route') || '';
  let to = '/';

  if (route === 'product/product' && map.prods[q.get('product_id')]) to = map.prods[q.get('product_id')];
  else if (route === 'product/category') {
    const path = q.get('path') || '';
    to = map.cats[path] || map.cats[path.split('_').pop()] || map.cats[path.split('_')[0]] || '/catalogo/';
  } else if (route === 'product/search') to = `/catalogo/${q.get('search') ? `?q=${encodeURIComponent(q.get('search'))}` : ''}`;
  else if (route === 'product/special' || route === 'product/manufacturer') to = '/catalogo/';
  else if (route === 'information/contact') to = '/contacto/';
  else if (route === 'information/information') to = INFO[q.get('information_id')] || '/';
  else if (route.startsWith('checkout/')) to = '/cotizar/';
  else if (route === 'information/sitemap') to = '/catalogo/';

  return Response.redirect(new URL(to, url.origin).toString(), 301);
}
