import { h, md } from '../util.js';
import { sonido } from '../sonido.js';

// Tarjetas de a una: decidir entre dos botones (por ejemplo "se puede" / "no se puede").
export function tarjetas(act, ctx) {
  let i = 0;
  const zona = h('div', { class: 'tarjeta-zona' });
  const progreso = h('p', { class: 'contador' });

  function mostrar() {
    const t = act.tarjetas[i];
    progreso.textContent = `Tarjeta ${i + 1} de ${act.tarjetas.length}`;
    const explicacion = h('div', { class: 'tarjeta__explicacion', 'aria-live': 'polite' });
    const siguiente = h('button', { type: 'button', class: 'btn btn--primario', hidden: true, onclick: () => {
      i += 1;
      if (i < act.tarjetas.length) mostrar();
      else {
        zona.replaceChildren(h('p', { class: 'tarjeta tarjeta--fin' }, `¡Revisaste las ${act.tarjetas.length} preguntas!`));
        progreso.textContent = '';
        ctx.bien();
      }
    } }, i + 1 < act.tarjetas.length ? 'Siguiente tarjeta →' : 'Terminar');

    const botones = ['si', 'no'].map((r) => h('button', {
      type: 'button', class: `btn btn--decision btn--${r}`,
      onclick: () => {
        if (r === t.respuesta) {
          botones.forEach((b) => { b.disabled = true; });
          sonido.bien();
          explicacion.replaceChildren(h('p', { class: 'fb fb--bien' }, h('strong', {}, '✓ Bien visto. '), t.explicacion));
          siguiente.hidden = false;
          siguiente.focus();
        } else {
          sonido.casi();
          explicacion.replaceChildren(h('p', { class: 'fb fb--casi' }, h('strong', {}, '↺ Miremos juntos. '), t.explicacion, ' Ahora que lo sabes, elige de nuevo.'));
        }
      },
    }, act.botones[r]));

    zona.replaceChildren(h('div', { class: 'tarjeta' },
      h('p', { class: 'tarjeta__pregunta', html: md(t.texto) }),
      h('div', { class: 'tarjeta__botones' }, botones),
      explicacion,
      h('div', { class: 'acciones' }, siguiente)));
  }

  mostrar();
  return h('div', {}, act.usaDatos ? ctx.tabla() : null, progreso, zona);
}
