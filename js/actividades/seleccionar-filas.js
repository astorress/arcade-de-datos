import { h } from '../util.js';

// Marcar las filas que cumplen una condición.
export function seleccionarFilas(act, ctx) {
  const marcadas = new Set(ctx.hecho ? act.esperadas : []);
  const estado = h('p', { class: 'contador' });
  const actualizar = () => { estado.textContent = marcadas.size ? `Marcaste: ${[...marcadas].sort().join(', ')}` : 'Aún no has marcado filas.'; };

  const tabla = ctx.tabla({
    modo: 'marcar', marcadas: [...marcadas],
    alTocar: (c, on) => { on ? marcadas.add(c) : marcadas.delete(c); actualizar(); },
  });

  const comprobar = h('button', { type: 'button', class: 'btn btn--primario', onclick: () => {
    const esperadas = new Set(act.esperadas);
    const sobran = [...marcadas].filter((c) => !esperadas.has(c));
    const faltan = act.esperadas.filter((c) => !marcadas.has(c));
    if (!marcadas.size) return ctx.casi('Toca al menos una fila de la tabla.');
    if (sobran.length) return ctx.casi(`${act.feedback.sobran} (Revisa: ${sobran.join(', ')})`);
    if (faltan.length) return ctx.casi(`${act.feedback.faltan} Llevas ${marcadas.size} de ${act.esperadas.length}.`);
    ctx.bien();
  } }, 'Comprobar');

  actualizar();
  return h('div', {}, tabla, estado, h('div', { class: 'acciones' }, comprobar));
}
