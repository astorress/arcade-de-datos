import { h } from '../util.js';

/**
 * Gráfico sencillo en SVG (barras o líneas), sin librerías.
 * {
 *   tipo: 'grafico', forma: 'barras' | 'lineas',
 *   titulo, etiquetas: ['Ene', 'Feb'], series: [{ nombre, valores: [..] }],
 *   ejeDesde: 0 (por defecto) o un número mayor para mostrar un eje recortado a propósito,
 *   unidad: 'kWh', nota: texto bajo el gráfico, sinValores: true para ocultar los números
 * }
 * Siempre incluye una tabla equivalente para lectores de pantalla.
 */
const NS = 'http://www.w3.org/2000/svg';
const COLORES = ['var(--naranja)', 'var(--magenta)', 'var(--verde)', 'var(--m-agua)'];

function s(tag, attrs = {}, ...hijos) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) el.setAttribute(k, String(v));
  hijos.flat().forEach((c) => c != null && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return el;
}

const fmt = (v) => (typeof v === 'number' ? v.toLocaleString('es-CO') : String(v));

export function grafico(g) {
  const forma = g.forma || 'barras';
  const etiquetas = g.etiquetas || [];
  const series = g.series || [];
  const todos = series.flatMap((x) => x.valores).filter((v) => typeof v === 'number');
  const desde = typeof g.ejeDesde === 'number' ? g.ejeDesde : 0;
  const maxDato = Math.max(...todos, desde + 1);
  const paso = pasoBonito((maxDato - desde) / 4);
  const hasta = desde + Math.ceil((maxDato - desde) / paso) * paso;

  const W = 440; const H = 260; const izq = 50; const der = 12; const arr = 16; const abj = 44;
  const ancho = W - izq - der; const alto = H - arr - abj;
  const y = (v) => arr + alto - ((v - desde) / (hasta - desde)) * alto;
  const banda = ancho / Math.max(etiquetas.length, 1);

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'grafico__svg', role: 'img', 'aria-hidden': 'true', focusable: 'false' });
  for (let v = desde; v <= hasta + 1e-9; v += paso) {
    svg.appendChild(s('line', { x1: izq, x2: W - der, y1: y(v), y2: y(v), class: 'grafico__guia' }));
    svg.appendChild(s('text', { x: izq - 6, y: y(v) + 4, 'text-anchor': 'end', class: 'grafico__eje' }, fmt(Math.round(v * 100) / 100)));
  }
  if (desde !== 0) svg.appendChild(s('text', { x: 4, y: arr + alto + 4, class: 'grafico__corte' }, '≈'));
  etiquetas.forEach((et, i) => svg.appendChild(s('text', { x: izq + banda * (i + 0.5), y: H - abj + 18, 'text-anchor': 'middle', class: 'grafico__eje' }, et)));
  svg.appendChild(s('line', { x1: izq, x2: W - der, y1: arr + alto, y2: arr + alto, class: 'grafico__base' }));

  series.forEach((serie, k) => {
    const color = serie.color ? `var(--${serie.color})` : COLORES[k % COLORES.length];
    if (forma === 'lineas') {
      const pts = serie.valores.map((v, i) => (typeof v === 'number' ? [izq + banda * (i + 0.5), y(v)] : null));
      let d = ''; let abierto = false;
      pts.forEach((p) => { if (!p) { abierto = false; return; } d += `${abierto ? 'L' : 'M'}${p[0]},${p[1]} `; abierto = true; });
      svg.appendChild(s('path', { d, fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-linejoin': 'round' }));
      pts.forEach((p, i) => {
        if (!p) return;
        svg.appendChild(s('rect', { x: p[0] - 5, y: p[1] - 5, width: 10, height: 10, fill: color }));
        if (!g.sinValores) svg.appendChild(s('text', { x: p[0], y: p[1] - 10, 'text-anchor': 'middle', class: 'grafico__valor' }, fmt(serie.valores[i])));
      });
    } else {
      const n = series.length; const anchoBarra = (banda * 0.7) / n;
      serie.valores.forEach((v, i) => {
        if (typeof v !== 'number') return;
        const x = izq + banda * i + banda * 0.15 + anchoBarra * k;
        const top = y(Math.max(v, desde));
        svg.appendChild(s('rect', { x, y: top, width: anchoBarra - 2, height: arr + alto - top, fill: color }));
        if (!g.sinValores) svg.appendChild(s('text', { x: x + (anchoBarra - 2) / 2, y: top - 6, 'text-anchor': 'middle', class: 'grafico__valor' }, fmt(v)));
      });
    }
  });

  const leyenda = series.length > 1
    ? h('ul', { class: 'grafico__leyenda', 'aria-hidden': 'true' }, series.map((x, k) => h('li', {}, h('span', { class: 'grafico__muestra', style: `background:${x.color ? `var(--${x.color})` : COLORES[k % COLORES.length]}` }), x.nombre)))
    : null;

  const tablaSr = h('div', { class: 'sr-only' }, h('table', {},
    h('caption', {}, g.titulo || 'Gráfico'),
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, ''), series.map((x) => h('th', { scope: 'col' }, x.nombre || g.unidad || 'Valor')))),
    h('tbody', {}, etiquetas.map((et, i) => h('tr', {}, h('th', { scope: 'row' }, et), series.map((x) => h('td', {}, x.valores[i] ?? '—')))))));

  return h('figure', { class: 'grafico' },
    g.titulo ? h('figcaption', { class: 'grafico__titulo' }, g.titulo, g.unidad ? ` (${g.unidad})` : '') : null,
    svg, leyenda, tablaSr,
    g.nota ? h('p', { class: 'grafico__nota' }, g.nota) : null);
}

function pasoBonito(x) {
  if (x <= 0) return 1;
  const e = 10 ** Math.floor(Math.log10(x));
  const f = x / e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e;
}
