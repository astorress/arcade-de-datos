import { h, md } from '../util.js';
import { apoyo } from './apoyo.js';

// Selección única (respuesta inmediata) o múltiple (con botón Comprobar).
export function seleccion(act, ctx) {
  const cont = h('div', { class: 'act-seleccion' });
  if (act.apoyo) cont.appendChild(apoyo(act.apoyo));
  if (act.usaDatos) cont.appendChild(ctx.tabla());

  if (act.multiple) return multiple(act, ctx, cont);

  const botones = act.opciones.map((op, i) =>
    h('button', { type: 'button', class: 'opcion', onclick: () => elegir(i) },
      h('span', { class: 'opcion__letra', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)),
      h('span', { class: 'opcion__texto', html: md(op.texto) }),
      h('span', { class: 'opcion__estado' }))
  );

  function elegir(i) {
    const op = act.opciones[i];
    botones.forEach((b) => b.classList.remove('opcion--revisar'));
    if (op.correcta) {
      botones.forEach((b, j) => {
        b.disabled = j !== i;
        if (j === i) {
          b.classList.add('opcion--bien');
          b.querySelector('.opcion__estado').textContent = '✓ Bien visto';
        }
      });
      ctx.bien();
    } else {
      botones[i].classList.add('opcion--revisar');
      botones[i].querySelector('.opcion__estado').textContent = '↺ Miremos por qué';
      ctx.casi(op.feedback || 'Esta opción no encaja del todo. Vuelve a mirar la tabla y prueba otra.');
    }
  }

  if (ctx.hecho) {
    const i = act.opciones.findIndex((o) => o.correcta);
    if (botones[i]) {
      botones[i].classList.add('opcion--bien');
      botones[i].querySelector('.opcion__estado').textContent = '✓';
    }
  }

  cont.appendChild(h('div', { class: 'opciones', role: 'group', 'aria-label': 'Opciones de respuesta' }, botones));
  return cont;
}

function multiple(act, ctx, cont) {
  const casillas = act.opciones.map((op, i) => {
    const input = h('input', { type: 'checkbox', id: `${act.id}-${i}` });
    return { op, input, label: h('label', { class: 'casilla', for: `${act.id}-${i}` }, input, h('span', { html: md(op.texto) })) };
  });

  const comprobar = h('button', { type: 'button', class: 'btn btn--primario', onclick: revisar }, 'Comprobar');

  function revisar() {
    const sobran = casillas.filter((c) => c.input.checked && !c.op.correcta);
    const faltan = casillas.filter((c) => !c.input.checked && c.op.correcta);
    const bienMarcadas = casillas.filter((c) => c.input.checked && c.op.correcta).length;
    casillas.forEach((c) => c.label.classList.remove('casilla--revisar'));
    if (!sobran.length && !faltan.length) {
      casillas.forEach((c) => { c.input.disabled = true; if (c.op.correcta) c.label.classList.add('casilla--bien'); });
      comprobar.disabled = true;
      ctx.bien();
      return;
    }
    const partes = [];
    if (bienMarcadas) partes.push(`Vas bien: ${bienMarcadas} de tus marcas encajan.`);
    if (sobran.length) {
      sobran.forEach((c) => c.label.classList.add('casilla--revisar'));
      partes.push(sobran[0].op.feedback || 'Hay una marca que conviene revisar.');
    } else if (faltan.length) {
      partes.push(faltan[0].op.siFalta || 'Todavía falta algo por marcar.');
    }
    ctx.casi(partes.join(' '));
  }

  if (ctx.hecho) casillas.forEach((c) => { c.input.checked = !!c.op.correcta; });

  cont.appendChild(h('fieldset', { class: 'casillas' },
    h('legend', { class: 'sr-only' }, 'Marca todas las que apliquen'),
    casillas.map((c) => c.label)));
  cont.appendChild(h('div', { class: 'acciones' }, comprobar));
  return cont;
}
