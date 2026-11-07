import { h } from '../util.js';

// Conteo por categoría con botones − / + (cómodos en el celular) y retroalimentación por error común.
export function conteo(act, ctx) {
  const valores = Object.fromEntries(act.categorias.map((c) => [c, ctx.hecho ? act.esperado[c] : 0]));

  const filas = act.categorias.map((cat) => {
    const id = `${act.id}-${cat}`;
    const input = h('input', { type: 'number', inputmode: 'numeric', min: '0', max: '99', id, class: 'contador-input', value: String(valores[cat]) });
    input.addEventListener('input', () => { valores[cat] = Math.max(0, parseInt(input.value, 10) || 0); });
    const cambiar = (d) => { valores[cat] = Math.max(0, valores[cat] + d); input.value = String(valores[cat]); };
    return h('div', { class: 'conteo-fila' },
      h('label', { for: id, class: 'conteo-fila__nombre' }, cat),
      h('div', { class: 'stepper' },
        h('button', { type: 'button', class: 'stepper__btn', 'aria-label': `Restar uno a ${cat}`, onclick: () => cambiar(-1) }, '−'),
        input,
        h('button', { type: 'button', class: 'stepper__btn', 'aria-label': `Sumar uno a ${cat}`, onclick: () => cambiar(1) }, '+')));
  });

  const igual = (a, b) => act.categorias.every((c) => Number(a[c]) === Number(b[c]));

  const comprobar = h('button', { type: 'button', class: 'btn btn--primario', onclick: () => {
    if (igual(valores, act.esperado)) return ctx.bien();
    const comun = (act.erroresComunes || []).find((e) => igual(valores, e.valores));
    if (comun) return ctx.casi(comun.mensaje);
    const malas = act.categorias.filter((c) => Number(valores[c]) !== act.esperado[c]);
    const buenas = act.categorias.length - malas.length;
    const base = (act.mensajeGeneral || 'Revisa {categorias}.').replace('{categorias}', malas.join(' y '));
    ctx.casi(`${buenas ? `${buenas} de ${act.categorias.length} ya están bien. ` : ''}${base}`);
  } }, 'Comprobar');

  return h('div', {},
    act.usaDatos ? ctx.tabla({ resaltar: act.resaltar || [] }) : null,
    h('div', { class: 'conteo' }, filas),
    h('div', { class: 'acciones' }, comprobar));
}
