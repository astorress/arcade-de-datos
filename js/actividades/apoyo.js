import { h, md } from '../util.js';

// Bloques de apoyo visual que una actividad puede mostrar antes de preguntar.
export function apoyo(a) {
  if (a.tipo === 'comparacion') {
    return h('div', { class: 'comparacion' },
      a.items.map((it) => h('div', { class: 'comparacion__item' },
        h('span', { class: 'comparacion__etiqueta' }, it.etiqueta),
        h('p', { html: md(it.texto) }))));
  }
  if (a.tipo === 'tabla') {
    return h('div', { class: 'tabla-scroll', tabindex: '0', role: 'region', 'aria-label': 'Tabla de apoyo' },
      h('table', { class: 'tabla tabla--apoyo' },
        h('thead', {}, h('tr', {}, a.columnas.map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', {}, a.filas.map((f) => h('tr', {}, f.map((v, i) => (i === 0 ? h('th', { scope: 'row' }, v) : h('td', {}, v))))))));
  }
  if (a.tipo === 'texto') return h('div', { class: 'caja-apoyo', html: md(a.texto) });
  return h('div');
}
