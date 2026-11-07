import { h, md } from '../util.js';

// Completar una frase con huecos {0}, {1}… y, si se quiere, texto libre que va al cuaderno.
export function completar(act, ctx) {
  const elegido = act.huecos.map(() => null);
  const huecosEl = [];
  const partes = act.frase.split(/(\{\d+\})/);

  const frase = h('p', { class: 'frase' }, partes.map((parte) => {
    const m = parte.match(/^\{(\d+)\}$/);
    if (!m) return parte;
    const i = Number(m[1]);
    const el = h('span', { class: 'hueco', 'aria-label': `Espacio ${i + 1}` }, '____');
    huecosEl[i] = el;
    return el;
  }));

  const grupos = act.huecos.map((hueco, i) => h('fieldset', { class: 'grupo-hueco' },
    h('legend', {}, `Espacio ${i + 1}`),
    h('div', { class: 'chips' }, hueco.opciones.map((op, j) => {
      const id = `${act.id}-${i}-${j}`;
      const input = h('input', {
        type: 'radio', name: `${act.id}-${i}`, id,
        onchange: () => { elegido[i] = j; huecosEl[i].textContent = op.texto; huecosEl[i].classList.add('hueco--lleno'); },
      });
      if (ctx.hecho && op.correcta) { input.checked = true; elegido[i] = j; }
      return h('label', { class: 'chip', for: id }, input, h('span', {}, op.texto));
    }))));

  if (ctx.hecho) act.huecos.forEach((hu, i) => {
    const j = hu.opciones.findIndex((o) => o.correcta);
    huecosEl[i].textContent = hu.opciones[j].texto;
    huecosEl[i].classList.add('hueco--lleno');
  });

  const comprobar = h('button', { type: 'button', class: 'btn btn--primario', onclick: () => {
    const vacio = elegido.findIndex((e) => e === null);
    if (vacio >= 0) return ctx.casi(`Elige una opción para el espacio ${vacio + 1}.`);
    const malo = elegido.findIndex((e, i) => !act.huecos[i].opciones[e].correcta);
    if (malo >= 0) {
      const op = act.huecos[malo].opciones[elegido[malo]];
      const otros = elegido.filter((e, i) => i !== malo && act.huecos[i].opciones[e].correcta).length;
      return ctx.casi(`${otros ? 'El otro espacio está bien. ' : ''}En el espacio ${malo + 1}: ${op.feedback || 'prueba otra opción.'}`);
    }
    ctx.bien();
  } }, 'Comprobar');

  let libre = null;
  if (act.textoLibre) {
    const ta = h('textarea', { id: `${act.id}-libre`, rows: '3', class: 'campo' });
    ta.value = ctx.texto(act.textoLibre.clave);
    ta.addEventListener('input', () => ctx.guardar(act.textoLibre.clave, ta.value));
    libre = h('div', { class: 'libre' }, h('label', { for: ta.id, html: md(act.textoLibre.etiqueta) }), ta);
  }

  return h('div', {}, h('div', { class: 'frase-caja' }, frase), grupos, h('div', { class: 'acciones' }, comprobar), libre);
}
