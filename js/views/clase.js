import { h, md, rotulo } from '../util.js';
import { tablaDatos } from '../components/tabla.js';
import { apoyo } from '../actividades/apoyo.js';
import { dialogoGuia } from '../components/guia.js';

// Modo clase: diapositivas generadas desde el contenido de la misión, para proyectar en la sesión en vivo.

function opcionesConLetras(opciones, correctaFn) {
  return h('ol', { class: 'clase-opciones' }, opciones.map((o, i) =>
    h('li', { class: 'clase-opcion', dataset: { correcta: correctaFn(o) ? 'si' : 'no' } },
      h('span', { class: 'clase-opcion__letra' }, String.fromCharCode(65 + i)),
      h('span', { html: md(o.texto) }))));
}

function diapositivas(c, m) {
  // Con varios casos a la vez: las diapositivas de cada caso, una tras otra.
  if (m.grupos?.length > 1) return m.grupos.flatMap((g) => diapositivasCaso(c, g.mision));
  return diapositivasCaso(c, m);
}

function diapositivasCaso(c, m) {
  const d = [];
  const g = c.sitio.guia || {};
  d.push({ titulo: `Misión ${m.numero}`, cuerpo: () => [
    h('p', { class: 'clase-pre' }, rotulo(`Misión ${m.numero} · Sesión ${m.numero}`)),
    h('h1', { class: 'clase-titulo' }, m.titulo),
    h('p', { class: 'clase-sub' }, m.sesion),
    dialogoGuia(m.historia, { nombre: g.nombre, animado: false }),
  ] });
  if (m.datos) d.push({ titulo: 'Los datos', cuerpo: () => [h('h2', { class: 'clase-h2' }, 'Los datos'), tablaDatos(m.datos)] });

  for (const n of m.niveles) {
    d.push({ titulo: `Nivel ${n.numero}`, cuerpo: () => [
      h('p', { class: 'clase-pre' }, rotulo(`Nivel ${n.numero}`)),
      h('h1', { class: 'clase-titulo' }, n.titulo),
      h('p', { class: 'clase-sub' }, n.objetivo),
    ] });
    for (const a of n.actividades) {
      const base = (extra = [], respuesta = []) => ({ titulo: a.titulo, conRespuesta: respuesta.length > 0 || !!a.explicacion, cuerpo: () => [
        h('h2', { class: 'clase-h2' }, a.titulo),
        h('div', { class: 'clase-consigna', html: md(a.consigna) }),
        a.apoyo ? apoyo(a.apoyo) : null,
        a.usaDatos || ['seleccionar-filas', 'leer-filas'].includes(a.tipo) ? tablaDatos(a.datosCaso || m.datos, { compacta: true, resaltar: a.resaltar || [] }) : null,
        ...extra,
        h('div', { class: 'clase-respuesta', hidden: true },
          ...respuesta,
          a.explicacion ? h('p', { html: md(a.explicacion) }) : null),
      ] });

      if (a.tipo === 'seleccion') {
        d.push(base([opcionesConLetras(a.opciones, (o) => o.correcta), h('p', { class: 'clase-voto' }, a.multiple ? 'Escriban en el chat todas las letras que apliquen.' : 'Voten en el chat: A, B, C…')]));
      } else if (a.tipo === 'tarjetas') {
        a.tarjetas.forEach((t, i) => d.push({ titulo: `${a.titulo} ${i + 1}`, conRespuesta: true, cuerpo: () => [
          h('h2', { class: 'clase-h2' }, `${a.titulo} · ${i + 1} de ${a.tarjetas.length}`),
          h('p', { class: 'clase-pregunta', html: md(t.texto) }),
          opcionesConLetras([{ texto: a.botones.si, ok: t.respuesta === 'si' }, { texto: a.botones.no, ok: t.respuesta === 'no' }], (o) => o.ok),
          h('p', { class: 'clase-voto' }, 'Voten en el chat: A o B. Luego, una o dos personas explican por qué.'),
          h('div', { class: 'clase-respuesta', hidden: true }, h('p', {}, t.explicacion)),
        ] }));
      } else if (a.tipo === 'conteo') {
        d.push(base([], [h('p', { class: 'clase-resultado' }, a.categorias.map((cat) => `${cat} ${a.esperado[cat]}`).join(' · '))]));
      } else if (a.tipo === 'seleccionar-filas') {
        d.push(base([], [h('p', { class: 'clase-resultado' }, `Filas: ${a.esperadas.join(', ')}`)]));
      } else if (a.tipo === 'completar') {
        d.push(base([h('p', { class: 'clase-pregunta' }, a.frase.replace(/\{\d+\}/g, '_____'))],
          [h('p', { class: 'clase-resultado' }, a.frase.replace(/\{(\d+)\}/g, (_, k) => a.huecos[Number(k)].opciones.find((o) => o.correcta)?.texto || '___'))]));
      } else if (a.tipo === 'emparejar') {
        d.push(base([h('p', { class: 'clase-pregunta' }, `${a.pares.map((p) => p.item).join(' · ')}`), h('p', {}, `Tipos: ${a.tipos.map((t) => t.texto).join(' · ')}`)],
          [h('ul', {}, a.pares.map((p) => h('li', {}, h('strong', {}, p.item), ` → ${a.tipos.find((t) => t.id === p.correcto)?.texto}`)))]));
      } else if (a.tipo === 'constructor') {
        d.push({ titulo: 'El reto', conRespuesta: !!a.ejemplo, cuerpo: () => [
          h('h2', { class: 'clase-h2' }, 'El reto'),
          h('div', { class: 'clase-consigna', html: md(a.consigna) }),
          h('ol', { class: 'clase-pasos' }, a.pasos.map((p) => h('li', {}, h('strong', {}, p.titulo.replace(/^\d+ · /, '')), ' — ', h('span', { html: md(p.ayuda) })))),
          h('p', { class: 'clase-voto' }, `Rutas: ${a.rutas.map((r) => r.nombre).join(' · ')}`),
          h('div', { class: 'clase-respuesta', hidden: true }, h('p', { class: 'clase-pre' }, 'RESPUESTA DE REFERENCIA'), h('blockquote', { html: md(a.ejemplo) })),
        ] });
      } else if (a.tipo === 'escritura') {
        d.push({ titulo: a.titulo, cuerpo: () => [h('h2', { class: 'clase-h2' }, a.titulo), h('ul', { class: 'clase-pasos' }, a.frases.map((f) => h('li', {}, f.inicio)))] });
      } else {
        d.push(base());
      }
    }
  }
  if (m.fraseClave || m.paraLlevar?.lupa) {
    d.push({ titulo: 'Para llevar', cuerpo: () => [
      h('h2', { class: 'clase-h2' }, 'Para llevar'),
      m.paraLlevar?.lupa ? [h('p', {}, m.paraLlevar.lupaTitulo || 'Una buena pregunta…'), h('ul', { class: 'clase-pasos' }, m.paraLlevar.lupa.map((x) => h('li', {}, x)))] : null,
      m.fraseClave ? h('p', { class: 'frase-clave clase-pregunta' }, '«', m.fraseClave, '»') : null,
    ] });
  }
  return d;
}

export function vistaClase(c, m, paso) {
  const slides = diapositivas(c, m);
  let i = Math.min(Math.max(0, (Number(paso) || 1) - 1), slides.length - 1);
  const escenario = h('div', { class: 'clase-escenario', 'aria-live': 'polite' });
  const contador = h('span', { class: 'clase-contador' });
  const btnRespuesta = h('button', { type: 'button', class: 'btn btn--primario', onclick: () => alternarRespuesta() }, 'Mostrar respuesta (R)');
  const anterior = h('button', { type: 'button', class: 'btn', onclick: () => ir(i - 1), 'aria-label': 'Diapositiva anterior' }, '←');
  const siguiente = h('button', { type: 'button', class: 'btn', onclick: () => ir(i + 1), 'aria-label': 'Diapositiva siguiente' }, '→');

  function alternarRespuesta() {
    const r = escenario.querySelector('.clase-respuesta');
    if (!r) return;
    r.hidden = !r.hidden;
    escenario.classList.toggle('clase-escenario--revelado', !r.hidden);
    btnRespuesta.textContent = r.hidden ? 'Mostrar respuesta (R)' : 'Ocultar respuesta (R)';
  }

  function pintar() {
    const s = slides[i];
    escenario.classList.remove('clase-escenario--revelado');
    escenario.replaceChildren(...s.cuerpo().flat().filter(Boolean));
    contador.textContent = `${i + 1} / ${slides.length}`;
    btnRespuesta.hidden = !escenario.querySelector('.clase-respuesta');
    btnRespuesta.textContent = 'Mostrar respuesta (R)';
    anterior.disabled = i === 0;
    siguiente.disabled = i === slides.length - 1;
    history.replaceState(null, '', `#/clase/${m.numero}/${i + 1}`);
  }

  function ir(k) {
    if (k < 0 || k >= slides.length) return;
    i = k;
    pintar();
  }

  const teclas = (e) => {
    if (e.target.closest?.('input, textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); ir(i + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); ir(i - 1); }
    if (e.key === 'r' || e.key === 'R') alternarRespuesta();
  };
  document.addEventListener('keydown', teclas);
  document.body.classList.add('modo-clase');

  const vista = h('div', { class: `vista-clase color-${m.color || 'naranja'}` },
    h('h1', { class: 'sr-only', tabindex: '-1' }, `Modo clase · Misión ${m.numero}: ${m.titulo}`),
    escenario,
    h('nav', { class: 'clase-controles', 'aria-label': 'Controles de la presentación' },
      anterior, contador, siguiente, btnRespuesta,
      h('button', { type: 'button', class: 'btn', onclick: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()) }, '⛶ Pantalla completa'),
      h('a', { class: 'btn', href: `#/mision/${m.numero}` }, 'Salir')));
  vista.limpiar = () => {
    document.removeEventListener('keydown', teclas);
    document.body.classList.remove('modo-clase');
    if (document.fullscreenElement) document.exitFullscreen?.();
  };
  pintar();
  return vista;
}
