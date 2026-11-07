import { h } from '../util.js';

// Emparejar: para cada elemento se toca una opción (alternativa táctil y accesible al arrastrar).
export function emparejar(act, ctx) {
  const eleccion = {};
  const filas = act.pares.map((par, i) => {
    const nombre = `${act.id}-${i}`;
    const estado = h('span', { class: 'par__estado' });
    const opciones = act.tipos.map((t) => {
      const input = h('input', {
        type: 'radio', name: nombre, value: t.id, id: `${nombre}-${t.id}`,
        onchange: () => { eleccion[par.item] = t.id; fila.classList.remove('par--revisar'); estado.textContent = ''; },
      });
      if (ctx.hecho && t.id === par.correcto) input.checked = true;
      return h('label', { class: 'chip', for: `${nombre}-${t.id}` }, input, h('span', {}, t.texto));
    });
    const fila = h('fieldset', { class: 'par' },
      h('legend', { class: 'par__item' }, par.item, estado),
      h('div', { class: 'chips' }, opciones));
    fila.estado = estado;
    return fila;
  });

  const comprobar = h('button', { type: 'button', class: 'btn btn--primario', onclick: revisar }, 'Comprobar');

  function revisar() {
    const sinElegir = act.pares.filter((p) => !eleccion[p.item]);
    if (sinElegir.length) {
      ctx.casi(`Te falta elegir el tipo de: ${sinElegir.map((p) => p.item).join(', ')}.`);
      return;
    }
    const errores = [];
    act.pares.forEach((p, i) => {
      const ok = eleccion[p.item] === p.correcto;
      filas[i].classList.toggle('par--bien', ok);
      filas[i].classList.toggle('par--revisar', !ok);
      filas[i].estado.textContent = ok ? ' ✓' : ' ↺ revisar';
      if (!ok) errores.push(p);
    });
    if (!errores.length) {
      filas.forEach((f) => f.querySelectorAll('input').forEach((i) => { i.disabled = true; }));
      comprobar.disabled = true;
      ctx.bien();
    } else {
      const aciertos = act.pares.length - errores.length;
      ctx.casi(`${aciertos ? `Llevas ${aciertos} de ${act.pares.length} bien. ` : ''}Revisa ${errores[0].item}: ${errores[0].feedback}`);
    }
  }

  const leyenda = act.tipos.some((t) => t.ayuda)
    ? h('dl', { class: 'leyenda-tipos' }, act.tipos.flatMap((t) => [h('dt', {}, t.texto), h('dd', {}, t.ayuda || '')]))
    : null;

  return h('div', {}, act.usaDatos ? ctx.tabla() : null, leyenda, h('div', { class: 'pares' }, filas), h('div', { class: 'acciones' }, comprobar));
}
