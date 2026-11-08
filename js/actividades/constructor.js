import { h, md, plano, copiar, aviso, imprimir } from '../util.js';

// Constructor guiado del reto: rutas, pasos con pistas, lista de verificación, ejemplo resuelto, copiar e imprimir.
// La página NO califica el texto libre: ofrece criterios para que la persona se autoevalúe.
export function constructor(act, ctx) {
  const k = (clave) => `reto-${clave}`;
  const cont = h('div', { class: 'constructor' });

  // 1. Rutas
  const rutaGuardada = ctx.texto(k('ruta'));
  const rutas = h('fieldset', { class: 'rutas' },
    h('legend', {}, 'Elige tu ruta (todas valen lo mismo):'),
    act.rutas.map((r) => {
      const id = `${act.id}-ruta-${r.id}`;
      const input = h('input', { type: 'radio', name: `${act.id}-ruta`, id, value: r.id, onchange: () => elegirRuta(r) });
      if (rutaGuardada === r.id) input.checked = true;
      return h('label', { class: 'ruta', for: id }, input,
        h('span', { class: 'ruta__nombre' }, r.nombre),
        h('span', { class: 'ruta__desc' }, r.descripcion));
    }));

  const consignaRuta = h('div', { class: 'consigna-ruta', 'aria-live': 'polite' });
  const campos = {};

  // 2. Pasos
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
          aviso('Códigos agregados al paso 3.');
        } }, 'Agregar los códigos marcados'));
    }

    return h('div', { class: 'paso' },
      h('label', { for: id, class: 'paso__titulo' }, paso.titulo),
      h('p', { id: `${id}-ayuda`, class: 'paso__ayuda', html: md(paso.ayuda) }),
      selector,
      ta,
      h('div', { class: 'paso__pistas' }, btnPista, pistasEl));
  });

  function elegirRuta(r) {
    ctx.guardar(k('ruta'), r.id);
    consignaRuta.replaceChildren(
      r.preguntaDada
        ? h('p', {}, h('strong', {}, `${r.nombre}: `), 'tu pregunta es ', h('q', {}, r.preguntaDada), '. Ya la pusimos en el paso 1.')
        : h('p', {}, h('strong', {}, `${r.nombre}: `), r.descripcion));
    if (r.preguntaDada) {
      const ta = campos[act.pasos[0].clave];
      if (!ta.value.trim() || act.rutas.some((o) => o.preguntaDada && o.preguntaDada === ta.value.trim())) {
        ta.value = r.preguntaDada;
        ctx.guardar(k(act.pasos[0].clave), ta.value);
      }
    }
  }
  const rutaInicial = act.rutas.find((r) => r.id === rutaGuardada);
  if (rutaInicial) elegirRuta(rutaInicial);

  // 3. Papel
  const papel = h('input', { type: 'checkbox', id: `${act.id}-papel` });
  papel.checked = ctx.texto(k('papel')) === 'si';
  papel.addEventListener('change', () => { ctx.guardar(k('papel'), papel.checked ? 'si' : ''); revisarEjemplo(); });

  // 4. Lista de verificación
  const checks = act.verificacion.map((txt, i) => {
    const id = `${act.id}-v${i}`;
    const input = h('input', { type: 'checkbox', id });
    input.checked = ctx.texto(k(`v${i}`)) === 'si';
    input.addEventListener('change', () => ctx.guardar(k(`v${i}`), input.checked ? 'si' : ''));
    return { input, el: h('label', { class: 'casilla', for: id }, input, h('span', {}, txt)) };
  });

  // 5. Ejemplo resuelto (se abre después de intentarlo)
  const ejemploBtn = h('button', { type: 'button', class: 'btn', disabled: true }, '🔒 Ver ejemplo resuelto');
  const ejemplo = h('div', { class: 'ejemplo', hidden: true },
    h('p', { class: 'ejemplo__titulo' }, 'Ejemplo resuelto (una de muchas respuestas posibles)'),
    h('blockquote', { html: md(act.ejemplo) }),
    h('p', { class: 'ejemplo__nota' }, 'Compáralo con el tuyo usando la lista de verificación. No se trata de copiarlo.'));
  ejemploBtn.addEventListener('click', () => {
    ejemplo.hidden = !ejemplo.hidden;
    ejemploBtn.textContent = ejemplo.hidden ? 'Ver ejemplo resuelto' : 'Ocultar ejemplo';
  });
  const dadas = new Set(act.rutas.map((r) => r.preguntaDada).filter(Boolean));
  const intentado = () => papel.checked || Object.values(campos).some((t) => t.value.trim() && !dadas.has(t.value.trim()));
  function revisarEjemplo() {
    if (intentado() && ejemploBtn.disabled) {
      ejemploBtn.disabled = false;
      ejemploBtn.textContent = 'Ver ejemplo resuelto';
    }
  }
  revisarEjemplo();

  // 6. Copiar / imprimir
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

  // 7. Terminar
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
    rutas,
    consignaRuta,
    h('div', { class: 'pasos' }, pasos),
    h('label', { class: 'casilla casilla--papel', for: papel.id }, papel, h('span', {}, 'Lo hice en mi cuaderno de papel (no necesito escribir aquí).')),
    h('fieldset', { class: 'verificacion' }, h('legend', {}, '✔ Lista de verificación'), checks.map((c) => c.el)),
    h('div', { class: 'acciones acciones--envolver' }, ejemploBtn, btnCopiar, btnImprimir),
    ejemplo,
    h('div', { class: 'acciones' }, terminar));
  return cont;
}
