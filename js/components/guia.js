import { h, md, plano, reducirMovimiento, rotulo } from '../util.js';

// Profe Dato: el guía que cuenta la historia y acompaña los errores.
// Retrato 12 x 12: o contorno · S piel · H pelo · g gafas · c camisa · b corbatín · w brillo de gafas
const RETRATO = [
  '...HHHHHH...',
  '..HHHHHHHH..',
  '.oHHSSSSHHo.',
  '.oSSSSSSSSo.',
  '.ogggSSgggo.',
  '.ogwgggwggo.',
  '.oSSSSSSSSo.',
  '..oSSmmSSo..',
  '...oSSSSo...',
  '..ccccccccc.',
  '.ccccbbcccc.',
  '.cccccccccc.',
];
const PALETA = { o: '#1E1B33', S: '#E8B48A', H: '#B8B3C8', g: '#1E1B33', w: '#9FD8F5', m: '#9C3B3B', c: '#7FC200', b: '#CB318E' };

export function retratoGuia(tam = 56) {
  let r = '';
  RETRATO.forEach((fila, y) => [...fila].forEach((ch, x) => {
    if (ch !== '.') r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${PALETA[ch]}"/>`;
  }));
  return `<svg viewBox="0 0 12 12" width="${tam}" height="${tam}" shape-rendering="crispEdges" class="sprite retrato-guia" aria-hidden="true" focusable="false">${r}</svg>`;
}

export const elegir = (lista) => (Array.isArray(lista) && lista.length ? lista[Math.floor(Math.random() * lista.length)] : '');

/**
 * Caja de diálogo del guía.
 * texto: admite **negrita**. opciones: { nombre, tono: 'bien'|'casi'|'' , titulo, compacto, animado }
 * El texto completo siempre está en el DOM (oculto visualmente mientras se "escribe"), para lectores de pantalla y para copiar.
 */
export function dialogoGuia(texto, { nombre = 'Profe Dato', tono = '', titulo = '', compacto = false, animado = true } = {}) {
  const completo = h('span', { class: 'sr-only' }, plano(titulo ? `${titulo} ${texto}` : texto));
  const visible = h('span', { class: 'dialogo-guia__texto', 'aria-hidden': 'true' });
  const final = () => { visible.innerHTML = (titulo ? `<strong>${md(titulo)}</strong> ` : '') + md(texto); caja.classList.add('dialogo-guia--listo'); };

  const caja = h('div', { class: `dialogo-guia ${tono ? `dialogo-guia--${tono}` : ''} ${compacto ? 'dialogo-guia--compacto' : ''}` },
    h('div', { class: 'dialogo-guia__retrato', html: retratoGuia(compacto ? 44 : 64) }),
    h('div', { class: 'dialogo-guia__burbuja' },
      h('p', { class: 'dialogo-guia__nombre', 'aria-hidden': 'true' }, rotulo(nombre)),
      h('p', { class: `dialogo-guia__cuerpo ${tono ? `fb fb--${tono}` : ''}` }, completo, visible),
      h('span', { class: 'dialogo-guia__seguir', 'aria-hidden': 'true' }, '▼')));

  if (!animado || reducirMovimiento()) {
    final();
    return caja;
  }

  // Efecto máquina de escribir sobre el texto plano; al terminar (o al tocar) se muestra con formato.
  const plain = plano(titulo ? `${titulo} ${texto}` : texto);
  let i = 0;
  let timer = null;
  const paso = () => {
    i += 2;
    visible.textContent = plain.slice(0, i);
    if (i >= plain.length) { clearInterval(timer); final(); }
  };
  caja.addEventListener('click', () => { clearInterval(timer); final(); });
  requestAnimationFrame(() => { timer = setInterval(paso, 18); });
  return caja;
}
