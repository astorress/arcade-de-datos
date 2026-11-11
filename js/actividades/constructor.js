import { h, md, plano, copiar, aviso, imprimir } from '../util.js';

// Constructor guiado del reto: la tabla, pasos con pistas, lista de verificación, ejemplo resuelto, copiar e imprimir.
// Cada persona formula su propia pregunta. La página NO califica el texto libre: ofrece criterios para autoevaluarse.
export function constructor(act, ctx) {
  const k = (clave) => `reto-${clave}`;
  const cont = h('div', { class: 'constructor' });
  const campos = {};

  // 1. Pasos
  const pasos = act.pasos.map((paso) => {
    const id = `${act.id}-${paso.clave}`;
    const ta = h('textarea', { id, rows: '3', class: 'campo', 'aria-describedby': `${id}-ayuda` });
    ta.value = ctx.texto(k(paso.clave));
    ta.addEventListener('input', () => { ctx.guardar(k(paso.clave), ta.value); revisarEjemplo(); });
    campos[paso.clave] = ta;

    let n = 0;
    const pistasEl = h('ol', { class: 'pistas' });
    const btnPista = h('button', { type: 'button', class: 'btn btn--pista', onclick: () => {
      if (n >= paso.pistas.length) return;
      pistasEl.appendChild(h('li', { html: md(paso.pistas[n]) }));
      n += 1;
      ctx.pista();
      btnPista.textContent = n < paso.pistas.length ? `💡 Otra pista (${n + 1}/${paso.pistas.length})` : '💡 No hay más pistas';
      btnPista.disabled = n >= paso.pistas.length;
    } }, `💡 Pedir pista (1/${paso.pistas.length})`);

    let selector = null;
    if (paso.permiteFilas) {
      const tabla = ctx.tabla({ modo: 'marcar', compacta: true });
      selector = h('details', { class: 'selector-filas' },
        h('summary', {}, 'Marcar filas en la tabla'),
        tabla,
        h('button', { type: 'button', class: 'btn', onclick: () => {
          const sel = tabla.seleccion();
          if (!sel.length) return aviso('Primero marca una o más filas.');
          ta.value = `${ta.value}${ta.value && !ta.value.endsWith('\n') ? '\n' : ''}Códigos: ${sel.join(', ')} → ${sel.length} ${sel.length === 1 ? (ctx.mision?.datos?.unidad?.[0] || 'registro') : (ctx.mision?.datos?.unidad?.[1] || 'registros')}.`;
          ctx.guardar(k(paso.clave), ta.value);
          revisarEjemplo();
          aviso(`Códigos agregados al paso «${paso.titulo}».`);
        } }, 'Agregar los códigos marcados'));
    }

    return h('div', { class: 'paso' },
      h('label', { for: id, class: 'paso__titulo' }, paso.titulo),
      h('p', { id: `${id}-ayuda`, class: 'paso__ayuda', html: md(paso.ayuda) }),
      selector,
      ta,
      h('div', { class: 'paso__pistas' }, btnPista, pistasEl));
  });

  // 2. Papel
  const papel = h('input', { type: 'checkbox', id: `${act.id}-papel` });
  papel.checked = ctx.texto(k('papel')) === 'si';
  papel.addEventListener('change', () => { ctx.guardar(k('papel'), papel.checked ? 'si' : ''); revisarEjemplo(); });

  // 3. Lista de verificación
  const checks = act.verificacion.map((txt, i) => {
    const id = `${act.id}-v${i}`;
    const input = h('input', { type: 'checkbox', id });
    input.checked = ctx.texto(k(`v${i}`)) === 'si';
    input.addEventListener('change', () => ctx.guardar(k(`v${i}`), input.checked ? 'si' : ''));
    return { input, el: h('label', { class: 'casilla', for: id }, input, h('span', {}, txt)) };
  });

  // 4. Ejemplo resuelto (se abre después de intentarlo)
  const ejemploBtn = h('button', { type: 'button', class: 'btn', disabled: true }, '🔒 Ver ejemplo resuelto');
  const ejemplo = h('div', { class: 'ejemplo', hidden: true },
    h('p', { class: 'ejemplo__titulo' }, 'Ejemplo resuelto (una de muchas respuestas posibles)'),
    h('blockquote', { html: md(act.ejemplo) }),
    h('p', { class: 'ejemplo__nota' }, 'Compáralo con el tuyo usando la lista de verificación. No se trata de copiarlo.'));
  ejemploBtn.addEventListener('click', () => {
    ejemplo.hidden = !ejemplo.hidden;
    ejemploBtn.textContent = ejemplo.hidden ? 'Ver ejemplo resuelto' : 'Ocultar ejemplo';
  });
  const intentado = () => papel.checked || Object.values(campos).some((t) => t.value.trim());
  function revisarEjemplo() {
    if (intentado() && ejemploBtn.disabled) {
      ejemploBtn.disabled = false;
      ejemploBtn.textContent = 'Ver ejemplo resuelto';
    }
  }
  revisarEjemplo();

  // 5. Copiar / imprimir
  const textoReto = () => [
    `MI RETO · ${ctx.mision.titulo}`,
    ...act.pasos.map((p) => `${p.titulo}\n${campos[p.clave].value.trim() || '(pendiente)'}`),
  ].join('\n\n');

  const btnCopiar = h('button', { type: 'button', class: 'btn', onclick: async () => {
    aviso((await copiar(textoReto())) ? 'Respuesta copiada. Pégala en tus notas o en el chat.' : 'No se pudo copiar. Selecciona el texto y cópialo a mano.');
  } }, '📋 Copiar mi respuesta');
  const btnImprimir = h('button', { type: 'button', class: 'btn', onclick: () => {
    imprimir(h('div', { class: 'hoja' },
      h('h1', {}, `Mi reto · Misión ${ctx.mision.numero}: ${ctx.mision.titulo}`),
      h('p', {}, plano(act.consigna)),
      act.pasos.map((p) => h('section', {}, h('h2', {}, p.titulo), h('p', { class: 'hoja__respuesta' }, campos[p.clave].value.trim() || ' '))),
      h('p', { class: 'hoja__pie' }, 'Datos ficticios, solo para practicar.')));
  } }, '🖨 Imprimir');

  // 6. Terminar
  const terminar = h('button', { type: 'button', class: 'btn btn--primario', onclick: () => {
    const vacios = act.pasos.filter((p) => !campos[p.clave].value.trim());
    if (vacios.length && !papel.checked) {
      return ctx.casi(`Vas avanzando. Te falta escribir: ${vacios.map((p) => p.titulo.replace(/^\d+ · /, '')).join('; ')}. Si lo hiciste en papel, marca la casilla «Lo hice en mi cuaderno».`);
    }
    const sinMarcar = checks.filter((c) => !c.input.checked);
    if (sinMarcar.length) {
      return ctx.casi(`Buen trabajo con los pasos. Antes de terminar, revisa tu respuesta con la lista de verificación: ${sinMarcar.length === 1 ? 'te falta 1 punto' : `te faltan ${sinMarcar.length} puntos`}. Si alguno no se cumple, ajusta tu respuesta: el ajuste es parte del reto.`);
    }
    ctx.bien('¡Reto completado! Tu respuesta quedó en tu cuaderno.');
  } }, 'Terminé mi reto');

  cont.append(
    ctx.tabla(),
    h('div', { class: 'pasos' }, pasos),
    h('label', { class: 'casilla casilla--papel', for: papel.id }, papel, h('span', {}, 'Lo hice en mi cuaderno de papel (no necesito escribir aquí).')),
    h('fieldset', { class: 'verificacion' }, h('legend', {}, '✔ Lista de verificación'), checks.map((c) => c.el)),
    h('div', { class: 'acciones acciones--envolver' }, ejemploBtn, btnCopiar, btnImprimir),
    ejemplo,
    h('div', { class: 'acciones' }, terminar));
  return cont;
}
