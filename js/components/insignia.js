import { h, pad2 } from '../util.js';

export const SIMBOLOS = {
  lupa: '🔍', escoba: '🧹', regla: '📏', balanza: '⚖️', embudo: '🧪', grafico: '📈', tablero: '📊', estrella: '⭐',
};

/** Insignia en SVG. Si no está ganada, se muestra en gris con un candado (forma + texto, no solo color). */
export function insignia(mision, ganada, tam = 96) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('width', tam);
  svg.setAttribute('height', tam);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', ganada ? `Insignia ganada: ${mision.insignia?.nombre}` : `Insignia por ganar: ${mision.insignia?.nombre}`);
  svg.classList.add('insignia', ganada ? 'insignia--ganada' : 'insignia--pendiente', `color-${mision.color || 'naranja'}`);
  const forma = 'M30 4 H70 L96 30 V70 L70 96 H30 L4 70 V30 Z';
  svg.innerHTML = `
    <path d="${forma}" class="insignia__fondo"/>
    <path d="${forma}" class="insignia__borde" fill="none" stroke-width="5"/>
    <rect x="18" y="64" width="64" height="18" class="insignia__cinta"/>
    <text x="50" y="78" text-anchor="middle" class="insignia__num">M${pad2(mision.numero)}</text>
    <text x="50" y="52" text-anchor="middle" class="insignia__simbolo">${ganada ? (SIMBOLOS[mision.insignia?.simbolo] || '★') : '🔒'}</text>`;
  return svg;
}

export function tarjetaInsignia(mision, ganada) {
  return h('figure', { class: `tarjeta-insignia ${ganada ? '' : 'tarjeta-insignia--pendiente'}` },
    insignia(mision, ganada, 72),
    h('figcaption', {},
      h('span', { class: 'tarjeta-insignia__nombre' }, mision.insignia?.nombre || `Misión ${mision.numero}`),
      h('span', { class: 'tarjeta-insignia__estado' }, ganada ? 'Ganada' : 'Por ganar')));
}
