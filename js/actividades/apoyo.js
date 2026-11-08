import { h, md } from '../util.js';
import { grafico } from '../components/grafico.js';

// Bloques de apoyo visual que una actividad puede mostrar antes de preguntar.
// `apoyo` puede ser un bloque o una lista de bloques.
export function apoyo(a) {
  if (Array.isArray(a)) return h('div', { class: 'apoyos' }, a.map(apoyo));
  if (a.tipo === 'comparacion') {
    return h('div', { class: 'comparacion' },
      a.items.map((it) => h('div', { class: 'comparacion__item' },
        h('span', { class: 'comparacion__etiqueta' }, it.etiqueta),
        it.grafico ? grafico(it.grafico) : null,
        it.texto ? h('p', { html: md(it.texto) }) : null)));
  }
  if (a.tipo === 'tabla') {
    return h('div', { class: 'tabla-scroll', tabindex: '0', role: 'region', 'aria-label': a.titulo || 'Tabla de apoyo' },
      h('table', { class: 'tabla tabla--apoyo' },
        a.titulo ? h('caption', {}, a.titulo) : null,
        h('thead', {}, h('tr', {}, a.columnas.map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', {}, a.filas.map((f) => h('tr', {}, f.map((v, i) => (i === 0 ? h('th', { scope: 'row' }, v) : h('td', {}, v))))))));
  }
  if (a.tipo === 'grafico') return grafico(a);
  if (a.tipo === 'texto') return h('div', { class: 'caja-apoyo', html: md(a.texto) });
  return h('div');
}
