import { h } from '../util.js';

export const ORDEN_FASES = ['hacer', 'observar', 'entender', 'aplicar'];
const ICONOS = { hacer: '🎮', observar: '👀', entender: '💡', aplicar: '🛠' };

/** Indicador del ciclo de Kolb: muestra en qué fase está la actividad (texto + forma, no solo color). */
export function kolb(fases, actual) {
  return h('div', { class: 'kolb', role: 'img', 'aria-label': `Ciclo de aprendizaje. Fase actual: ${fases[actual]?.nombre || ''}` },
    ORDEN_FASES.map((f) => h('span', { class: `kolb__fase ${f === actual ? 'kolb__fase--actual' : ''}`, 'aria-hidden': 'true' },
      h('span', { class: 'kolb__icono' }, ICONOS[f]),
      h('span', { class: 'kolb__nombre' }, fases[f]?.nombre || f))));
}

export function leyendaKolb(fases) {
  return h('ol', { class: 'leyenda-kolb' },
    ORDEN_FASES.map((f) => h('li', {}, h('span', { 'aria-hidden': 'true' }, `${ICONOS[f]} `), h('strong', {}, fases[f].nombre), ': ', fases[f].descripcion)));
}
