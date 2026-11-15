// Cotizador: guarda productos en localStorage y genera el mensaje para WhatsApp o correo.
type Item = { id: number; slug: string; name: string; code: string | null; qty: number };
const KEY = 'mpc-quote-v1';
const WA = '56986381820';
const MAIL = 'contacto@magicprintchile.cl';

const load = (): Item[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};
let items: Item[] = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} render(); };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function render() {
  const total = items.reduce((a, b) => a + b.qty, 0);
  document.querySelectorAll<HTMLElement>('[data-quote-count]').forEach((b) => {
    const prev = b.textContent;
    b.textContent = String(items.length);
    b.hidden = items.length === 0;
    if (prev !== b.textContent) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  });
  document.querySelectorAll<HTMLElement>('[data-quote-list]').forEach((ul) => {
    ul.innerHTML = items.map((it) => `
      <li data-id="${it.id}">
        <a class="qi-name" href="/producto/${it.slug}/">${esc(it.name)}</a>
        <div class="qi-ctrl">
          <button type="button" data-dec aria-label="Menos">−</button>
          <input type="number" min="1" inputmode="numeric" value="${it.qty}" aria-label="Cantidad" data-qty />
          <button type="button" data-inc aria-label="Más">+</button>
          <button type="button" data-del aria-label="Quitar">×</button>
        </div>
        <span class="qi-code">${it.code ? esc(it.code) : 'Producto a pedido'}</span>
      </li>`).join('');
  });
  document.querySelectorAll<HTMLElement>('[data-quote-empty]').forEach((e) => (e.hidden = items.length > 0));
  document.querySelectorAll<HTMLElement>('[data-add]').forEach((btn) => {
    const d = JSON.parse(btn.dataset.add!);
    btn.classList.toggle('is-added', items.some((i) => i.id === d.id));
  });
  return total;
}

function add(d: Omit<Item, 'qty'>, qty = 1) {
  const ex = items.find((i) => i.id === d.id);
  if (ex) ex.qty += qty; else items.push({ ...d, qty });
  save();
  toast(`${d.name.slice(0, 40)}${d.name.length > 40 ? '…' : ''} agregado`);
  (window as any).dataLayer?.push({ event: 'add_to_quote', item_id: d.id });
}

let tt: number | undefined;
function toast(msg: string) {
  const t = document.querySelector<HTMLElement>('[data-toast]');
  if (!t) return;
  t.querySelector('[data-toast-text]')!.textContent = msg;
  t.hidden = false;
  clearTimeout(tt);
  tt = window.setTimeout(() => (t.hidden = true), 3200);
}

function message(form: HTMLFormElement) {
  const f = new FormData(form);
  const lines = ['Hola MagicPrintChile 👋, quiero cotizar:', ''];
  if (items.length) items.forEach((i) => lines.push(`• ${i.qty} × ${i.name}${i.code ? ` (${i.code})` : ''}`));
  else lines.push('• (describo abajo lo que necesito)');
  lines.push('');
  const n = String(f.get('nombre') || '').trim(), e = String(f.get('empresa') || '').trim(), c = String(f.get('ciudad') || '').trim(), d = String(f.get('detalle') || '').trim();
  if (d) lines.push(`Detalles: ${d}`);
  if (n) lines.push(`Nombre: ${n}`);
  if (e) lines.push(`Empresa/Institución: ${e}`);
  if (c) lines.push(`Entrega en: ${c}`);
  return lines.join('\n');
}

export function initQuote() {
  const dlg = document.getElementById('quote-drawer') as HTMLDialogElement | null;
  document.addEventListener('click', (ev) => {
    const el = ev.target as HTMLElement;
    const addBtn = el.closest<HTMLElement>('[data-add]');
    if (addBtn) {
      ev.preventDefault();
      const qtyInput = addBtn.dataset.qtyFrom ? document.querySelector<HTMLInputElement>(addBtn.dataset.qtyFrom) : null;
      add(JSON.parse(addBtn.dataset.add!), Math.max(1, Number(qtyInput?.value) || 1));
      if (addBtn.dataset.openAfter !== undefined) dlg?.showModal();
      return;
    }
    if (el.closest('[data-quote-open]')) { ev.preventDefault(); document.querySelector<HTMLElement>('[data-toast]')!.hidden = true; dlg?.showModal(); return; }
    if (el.closest('[data-quote-close]')) { dlg?.close(); return; }
    const li = el.closest<HTMLElement>('[data-quote-list] li');
    if (li) {
      const it = items.find((i) => i.id === Number(li.dataset.id));
      if (!it) return;
      if (el.closest('[data-inc]')) { it.qty++; save(); }
      else if (el.closest('[data-dec]')) { it.qty = Math.max(1, it.qty - 1); save(); }
      else if (el.closest('[data-del]')) { items = items.filter((i) => i !== it); save(); }
    }
  });
  document.addEventListener('change', (ev) => {
    const inp = (ev.target as HTMLElement).closest<HTMLInputElement>('[data-qty]');
    const li = inp?.closest<HTMLElement>('li');
    const it = li && items.find((i) => i.id === Number(li.dataset.id));
    if (it && inp) { it.qty = Math.max(1, Number(inp.value) || 1); save(); }
  });
  dlg?.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });
  document.querySelectorAll<HTMLFormElement>('[data-quote-submit]').forEach((form) =>
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const via = ((ev as SubmitEvent).submitter as HTMLButtonElement | null)?.value || 'wa';
      if (!items.length && !String(new FormData(form).get('detalle') || '').trim()) {
        form.querySelector<HTMLTextAreaElement>('textarea')?.focus();
        toast('Agrega productos o describe lo que necesitas');
        return;
      }
      const text = message(form);
      (window as any).dataLayer?.push({ event: 'quote_submit', via, items: items.length });
      if (via === 'mail') location.href = `mailto:${MAIL}?subject=${encodeURIComponent('Cotización web MagicPrintChile')}&body=${encodeURIComponent(text)}`;
      else window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }),
  );
  addEventListener('storage', (e) => { if (e.key === KEY) { items = load(); render(); } });
  render();
}
