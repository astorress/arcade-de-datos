import { h, md, anunciar } from '../util.js';
import * as store from '../store.js';
import { disponible } from '../content.js';
import { seleccion } from '../actividades/seleccion.js';
import { tablaDatos } from '../components/tabla.js';
import { dialogoGuia, elegir } from '../components/guia.js';
import { sonido } from '../sonido.js';

const RONDA = 5;

/** Misiones jugadas: publicadas y con al menos una actividad hecha. */
export function misionesJugadas(c) {
  return c.misiones.filter((m) => disponible(m) && m.niveles.some((n) => n.actividades.some((a) => store.actividadHecha(m.numero, a.id))));
}

/** Banco de preguntas: selecciones de respuesta única y cada tarjeta de «¿se puede o no?». */
function banco(c) {
  const preguntas = [];
  for (const m of misionesJugadas(c)) {
    for (const n of m.niveles) {
      for (const a of n.actividades) {
        if (a.tipo === 'seleccion' && !a.multiple) preguntas.push({ m, act: { ...a, id: `rep-${a.id}` } });
        if (a.tipo === 'tarjetas') {
          a.tarjetas.forEach((t, i) => preguntas.push({
            m,
            act: {
              id: `rep-${a.id}-${i}`, tipo: 'seleccion', titulo: a.titulo, usaDatos: a.usaDatos, datosCaso: a.datosCaso,
              consigna: `¿Esta pregunta se puede responder **con esta tabla**? «${t.texto}»`,
              opciones: [
                { texto: a.botones.si, correcta: t.respuesta === 'si', feedback: t.explicacion },
                { texto: a.botones.no, correcta: t.respuesta === 'no', feedback: t.explicacion },
              ],
              explicacion: t.explicacion,
            },
          }));
        }
      }
    }
  }
  return preguntas;
}

function barajar(lista) {
  const l = [...lista];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

export function vistaRepaso(c) {
  const g = c.sitio.guia || {};
  const vista = h('div', { class: 'vista vista-repaso' });
  const todas = banco(c);

  if (!todas.length) {
    vista.append(
      h('h1', { tabindex: '-1' }, '⚡ Repaso relámpago'),
      dialogoGuia('Para el repaso necesito preguntas de misiones que ya jugaste. Juega al menos una actividad de una misión y vuelve aquí.', { nombre: g.nombre, animado: false }),
      h('a', { class: 'btn btn--primario', href: '#/' }, '🗺 Ir al mapa'));
    return vista;
  }

  const ronda = barajar(todas).slice(0, Math.min(RONDA, todas.length));
  let i = 0;
  let aLaPrimera = 0;
  const zona = h('div');

  const pintar = () => {
    const { m, act } = ronda[i];
    let intentos = 0;
    let resuelta = false;
    const feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });
    const explicacion = h('div', { class: 'explicacion', hidden: true }, h('p', { class: 'explicacion__titulo' }, '¿POR QUÉ?'), act.explicacion ? h('p', { html: md(act.explicacion) }) : null);
    const siguiente = h('button', { type: 'button', class: 'btn btn--primario', hidden: true, onclick: () => {
      i += 1;
      if (i < ronda.length) pintar(); else fin();
    } }, i + 1 < ronda.length ? 'Siguiente pregunta →' : 'Ver cómo me fue ★');

    const ctx = {
      mision: m, hecho: false,
      tabla: (op) => tablaDatos(act.datosCaso || m.datos, op),
      texto: () => '', guardar: () => {}, pista: () => {},
      bien: () => {
        if (resuelta) return;
        resuelta = true;
        if (intentos === 0) aLaPrimera += 1;
        sonido.bien();
        feedback.replaceChildren(dialogoGuia('', { nombre: g.nombre, tono: 'bien', titulo: `✓ ${elegir(g.bien) || '¡Bien visto!'}`, compacto: true }));
        explicacion.hidden = false;
        siguiente.hidden = false;
        anunciar('Bien visto. Puedes pasar a la siguiente pregunta.');
      },
      casi: (msg) => {
        intentos += 1;
        sonido.casi();
        feedback.replaceChildren(dialogoGuia(msg, { nombre: g.nombre, tono: 'casi', titulo: `↺ ${elegir(g.casi) || 'Miremos juntos.'}`, compacto: true }));
      },
    };

    zona.replaceChildren(
      h('p', { class: 'actividad__num' }, `PREGUNTA ${i + 1} DE ${ronda.length} · MISIÓN ${m.numero}`),
      h('div', { class: 'barra barra--repaso', role: 'img', 'aria-label': `Pregunta ${i + 1} de ${ronda.length}` },
        ronda.map((_, k) => h('span', { class: `barra__seg ${k < i ? 'barra__seg--lleno' : ''} ${k === i ? 'barra__seg--actual' : ''}` }))),
      h('h2', { class: 'actividad__titulo', tabindex: '-1' }, act.titulo),
      h('div', { class: 'consigna', html: md(act.consigna) }),
      seleccion(act, ctx),
      feedback, explicacion,
      h('div', { class: 'acciones' }, siguiente));
    zona.querySelector('h2')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  };

  const fin = () => {
    const revisando = ronda.length - aLaPrimera;
    sonido.nivel();
    zona.replaceChildren(h('div', { class: 'pantalla-nivel color-verde' },
      h('h2', { class: 'pantalla-nivel__titulo', tabindex: '-1' }, '¡RONDA TERMINADA!'),
      dialogoGuia(`Resolviste ${ronda.length} preguntas: **${aLaPrimera}** a la primera${revisando ? ` y **${revisando}** revisando. Revisar también es aprender: así se queda lo que entendiste` : '. ¡Lo tienes muy claro'}.`, { nombre: g.nombre, tono: 'bien' }),
      h('div', { class: 'acciones acciones--envolver acciones--centro' },
        h('button', { type: 'button', class: 'btn btn--start', onclick: () => { location.hash = '#/repaso'; window.dispatchEvent(new HashChangeEvent('hashchange')); } }, '⚡ OTRA RONDA'),
        h('a', { class: 'btn', href: '#/' }, 'Ir al mapa'))));
    zona.querySelector('h2')?.focus({ preventScroll: true });
  };

  vista.append(
    h('h1', { tabindex: '-1' }, '⚡ Repaso relámpago'),
    h('p', { class: 'nota' }, `${RONDA} preguntas al azar de las misiones que ya jugaste. Sin tiempo y sin puntos: es para que lo aprendido se quede.`),
    zona);
  pintar();
  return vista;
}
