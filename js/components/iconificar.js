import { icono } from './iconos.js';

// Reemplaza en pantalla los emojis de la interfaz por íconos pixel propios, para que se vean igual en todos los celulares.
// Los textos del código pueden seguir usando emojis (son más fáciles de leer); aquí se traducen.
const MAPA = {
  '🗺': 'mapa', '📖': 'glosario', '🏆': 'progreso', '❔': 'ayuda', '⚙': 'ajustes', '💡': 'pista', '🔒': 'candado',
  '📋': 'copiar', '🖨': 'imprimir', '📘': 'teoria', '📓': 'cuaderno', '🔐': 'candado', '🗑': 'basura', '💬': 'chat',
  '🕹': 'hacer', '🔄': 'reintentar', '🧑‍🎤': 'personaje', '🎮': 'hacer', '👀': 'observar', '🛠': 'aplicar', '🏠': 'casa',
  '🧪': 'probeta', '🎯': 'diana', '🎙': 'clase', '🧭': 'mapa', '⚡': 'repaso', '🎲': 'dado', '✏': 'personaje', '🎁': 'regalo',
  '👆': 'mano', '⚠': 'advertencia', '📽': 'clase', '🔊': 'sonido', '📤': 'compartir', '🃏': 'cartas', '🙂': 'vida',
};
const CLAVES = Object.keys(MAPA).sort((a, b) => b.length - a.length);
const PATRON = new RegExp(`(${CLAVES.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\uFE0F?`, 'u');
const NO_TOCAR = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'TITLE']);

function traducirNodo(nodo) {
  let texto = nodo.nodeValue;
  if (!texto || !PATRON.test(texto)) return;
  const padre = nodo.parentNode;
  if (!padre || NO_TOCAR.has(padre.nodeName) || padre.closest?.('svg')) return;
  const frag = document.createDocumentFragment();
  let m;
  while ((m = texto.match(PATRON))) {
    if (m.index > 0) frag.appendChild(document.createTextNode(texto.slice(0, m.index)));
    const span = document.createElement('span');
    span.className = 'icono-inline';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = icono(MAPA[m[1]], { tam: 20 });
    frag.appendChild(span);
    texto = texto.slice(m.index + m[0].length).replace(/^ /, ' ');
  }
  if (texto) frag.appendChild(document.createTextNode(texto));
  padre.replaceChild(frag, nodo);
}

export function iconificar(raiz) {
  const recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const nodos = [];
  while (recorrido.nextNode()) nodos.push(recorrido.currentNode);
  nodos.forEach(traducirNodo);
}

/** Traduce lo que ya está en pantalla y todo lo que se agregue o cambie después. */
export function iconificarSiempre(raiz = document.body) {
  iconificar(raiz);
  const obs = new MutationObserver((cambios) => {
    for (const c of cambios) {
      if (c.type === 'characterData') traducirNodo(c.target);
      c.addedNodes?.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) traducirNodo(n);
        else if (n.nodeType === Node.ELEMENT_NODE) iconificar(n);
      });
    }
  });
  obs.observe(raiz, { childList: true, subtree: true, characterData: true });
}
