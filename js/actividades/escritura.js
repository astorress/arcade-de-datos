import { h } from '../util.js';

// Completar frases abiertas. No se califican: se guardan en el cuaderno local.
export function escritura(act, ctx) {
  const campos = act.frases.map((f) => {
    const id = `${act.id}-${f.clave}`;
    const ta = h('textarea', { id, rows: '2', class: 'campo' });
    ta.value = ctx.texto(f.clave);
    ta.addEventListener('input', () => ctx.guardar(f.clave, ta.value));
    return { f, ta, el: h('div', { class: 'paso' }, h('label', { for: id, class: 'paso__titulo' }, f.inicio), ta) };
  });

  const papel = h('input', { type: 'checkbox', id: `${act.id}-papel` });
  const listo = h('button', { type: 'button', class: 'btn btn--primario', onclick: () => {
    const vacias = campos.filter((c) => !c.ta.value.trim());
    if (vacias.length && !papel.checked) return ctx.casi(`Completa también: «${vacias[0].f.inicio}». Si lo escribiste en papel, marca la casilla.`);
    ctx.bien();
  } }, 'Listo');

  return h('div', {},
    campos.map((c) => c.el),
    h('label', { class: 'casilla casilla--papel', for: papel.id }, papel, h('span', {}, 'Lo escribí en mi cuaderno de papel.')),
    h('div', { class: 'acciones' }, listo));
}
