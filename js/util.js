// Utilidades pequeñas para construir la interfaz sin librerías.

/**
 * Crea un elemento DOM.
 * h('button', { class: 'btn', onclick: fn }, 'Texto', otroNodo)
 * Atributos especiales: class, html (innerHTML ya saneado), on* (eventos), dataset.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Markdown mínimo y seguro: **negrita** y *cursiva*. */
export function md(s) {
  return escapeHtml(s ?? '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>');
}

/** Párrafo con markdown mínimo. */
export function p(texto, cls) {
  return h('p', { class: cls, html: md(texto) });
}

/** Quita el markdown para texto plano (copiar / imprimir). */
export function plano(s) {
  return String(s ?? '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
}

let liveRegion;
/** Anuncia un mensaje a lectores de pantalla. */
export function anunciar(msg) {
  if (!liveRegion) liveRegion = document.getElementById('anuncios');
  if (!liveRegion) return;
  liveRegion.textContent = '';
  setTimeout(() => { liveRegion.textContent = msg; }, 50);
}

/** Copia texto al portapapeles, con alternativa para navegadores viejos. */
export async function copiar(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch (_) { /* usar alternativa */ }
  try {
    const ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;opacity:0;top:0;left:0' });
    ta.value = texto;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (_) {
    return false;
  }
}

/** Pequeño aviso flotante (toast). */
export function aviso(msg) {
  const zona = document.getElementById('toasts');
  if (!zona) return;
  const t = h('div', { class: 'toast', role: 'status' }, msg);
  zona.appendChild(t);
  setTimeout(() => t.classList.add('toast--sale'), 2600);
  setTimeout(() => t.remove(), 3200);
}

/** Imprime solo el nodo dado (hoja limpia en blanco y negro). */
export function imprimir(nodo) {
  const zona = document.getElementById('zona-impresion');
  zona.replaceChildren(nodo);
  document.body.classList.add('modo-impresion');
  const limpiar = () => {
    document.body.classList.remove('modo-impresion');
    zona.replaceChildren();
    window.removeEventListener('afterprint', limpiar);
  };
  window.addEventListener('afterprint', limpiar);
  window.print();
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function reducirMovimiento() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Rótulo en mayúsculas para la fuente pixel. */
export function rotulo(s) {
  return String(s).toUpperCase();
}
