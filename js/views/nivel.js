import { h, md, anunciar, aviso, reducirMovimiento, rotulo } from '../util.js';
import * as store from '../store.js';
import { TIPOS } from '../actividades/index.js';
import { apoyo } from '../actividades/apoyo.js';
import { claveTexto, misionTerminada } from '../content.js';
import { tablaDatos } from '../components/tabla.js';
import { kolb } from '../components/kolb.js';
import { insignia } from '../components/insignia.js';
import { migas } from './mision.js';
import { recordemos } from './teoria.js';
import { miSprite, accesorioDeMision } from './personaje.js';
import { sonido } from '../sonido.js';
import { dialogoGuia, elegir } from '../components/guia.js';
import { confeti } from '../components/celebrar.js';
import { compartirInsignia } from '../components/compartir.js';
import { nombreJugador } from './personaje.js';

const guia = (c) => c.sitio.guia || { nombre: 'Profe Dato', bien: ['¡Bien visto!'], casi: ['Miremos juntos.'], intro: [], nivel: ['¡Nivel superado!'] };

export function vistaNivel(c, mision, numNivel, paso) {
  const nivel = mision.niveles.find((n) => n.numero === Number(numNivel));
  if (!nivel) return null;
  // Con varios casos a la vez, cada nivel trae su propia tabla.
  const m = nivel.datos ? { ...mision, datos: nivel.datos } : mision;
  if (paso === undefined) return intro(c, m, nivel);
  if (paso === 'fin') return fin(c, m, nivel);
  const i = Number(paso) - 1;
  if (!nivel.actividades[i]) return null;
  return actividad(c, m, nivel, i);
}

/** «Nivel 2» o, con varios casos a la vez, «Caso 1 · Nivel 2». */
export function nombreNivel(m, nivel) {
  const i = (m.grupos || []).findIndex((g) => g.clave === nivel.casoClave);
  return m.grupos?.length > 1 && i >= 0 ? `Caso ${i + 1} · Nivel ${nivel.numeroEnCaso}` : `Nivel ${nivel.numeroEnCaso || nivel.numero}`;
}

/** Primer nivel pendiente de otro caso (solo cuando la misión muestra varios casos). */
function otroCaso(m) {
  if (!(m.grupos?.length > 1)) return null;
  return m.niveles.find((n) => !store.nivelHecho(m.numero, n.numero)) || null;
}

function ruta(m, nivel, paso) {
  return `#/mision/${m.numero}/nivel/${nivel.numero}${paso !== undefined ? `/${paso}` : ''}`;
}

function intro(c, m, nivel) {
  const primeraPendiente = nivel.actividades.findIndex((a) => !store.actividadHecha(m.numero, a.id));
  const inicio = primeraPendiente >= 0 ? primeraPendiente + 1 : 1;
  return h('div', { class: 'vista vista-intro' }, migas(m, `${nombreNivel(m, nivel)}`),
    h('div', { class: `pantalla-nivel color-${m.color || 'naranja'}` },
      h('p', { class: 'pantalla-nivel__pre' }, rotulo(`Misión ${m.numero} · ${nombreNivel(m, nivel)}`)),
      h('h1', { tabindex: '-1', class: 'pantalla-nivel__titulo' }, nivel.titulo),
      h('p', { class: 'pantalla-nivel__obj' }, h('strong', {}, 'Objetivo: '), nivel.objetivo),
      h('p', {}, `${nivel.actividades.length} actividades · sin tiempo límite · las pistas no restan puntos.`),
      guia(c).intro?.length ? dialogoGuia(elegir(guia(c).intro), { nombre: guia(c).nombre, compacto: true }) : null,
      h('a', { class: 'btn btn--start', href: ruta(m, nivel, inicio) }, primeraPendiente > 0 ? '▶ CONTINUAR' : '▶ START'),
      m.teoria ? h('p', { class: 'pantalla-nivel__teoria' }, '¿Quieres repasar antes? ', h('a', { href: `#/mision/${m.numero}/teoria` }, '📘 Guía de teoría')) : null));
}

function pasosNivel(m, nivel, actual) {
  return h('ol', { class: 'pasos-nivel', 'aria-label': 'Actividades del nivel' },
    nivel.actividades.map((a, i) => {
      const hecha = store.actividadHecha(m.numero, a.id);
      const etiqueta = `Actividad ${i + 1}: ${a.titulo}${hecha ? ' (completada)' : ''}${i === actual ? ' (actual)' : ''}`;
      const clase = `pasos-nivel__punto ${hecha ? 'hecho' : ''} ${i === actual ? 'actual' : ''}`;
      return h('li', {}, hecha || i === actual
        ? h('a', { href: ruta(m, nivel, i + 1), class: clase, 'aria-label': etiqueta, 'aria-current': i === actual ? 'step' : null }, hecha ? '★' : String(i + 1))
        : h('span', { class: clase, 'aria-label': etiqueta }, String(i + 1)));
    }));
}

function actividad(c, m, nivel, i) {
  const act = nivel.actividades[i];
  const render = TIPOS[act.tipo];
  const hechoAntes = store.actividadHecha(m.numero, act.id);

  const feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });
  const explicacion = h('div', { class: 'explicacion', hidden: !hechoAntes },
    h('p', { class: 'explicacion__titulo' }, '¿POR QUÉ?'),
    act.explicacion ? h('p', { html: md(act.explicacion) }) : null);
  const esUltima = i === nivel.actividades.length - 1;
  const continuar = h('a', {
    class: `btn btn--primario btn--continuar ${hechoAntes ? '' : 'btn--bloqueado'}`,
    href: hechoAntes ? ruta(m, nivel, esUltima ? 'fin' : i + 2) : null,
    'aria-disabled': hechoAntes ? null : 'true',
    role: 'link',
  }, esUltima ? 'Terminar nivel ★' : 'Continuar →');
  const notaContinuar = h('p', { class: 'nota nota--continuar' }, hechoAntes ? '' : 'Completa la actividad para continuar. Puedes pedir pistas cuando quieras.');

  const ctx = {
    mision: m,
    hecho: hechoAntes,
    tabla: (op) => tablaDatos(m.datos, op),
    texto: (k) => store.texto(m.numero, claveTexto(nivel, k)),
    guardar: (k, v) => store.guardarTexto(m.numero, claveTexto(nivel, k), v),
    pista: () => store.sumarPista(m.numero),
    bien: (msg) => {
      feedback.replaceChildren(dialogoGuia(msg || '', { nombre: guia(c).nombre, tono: 'bien', titulo: `✓ ${elegir(guia(c).bien)}`, compacto: true }));
      explicacion.hidden = false;
      continuar.classList.remove('btn--bloqueado');
      continuar.removeAttribute('aria-disabled');
      continuar.setAttribute('href', ruta(m, nivel, esUltima ? 'fin' : i + 2));
      notaContinuar.textContent = '';
      if (store.marcarActividad(m.numero, act.id)) aviso(`+${c.sitio.puntos.actividad} puntos`);
      sonido.bien();
      anunciar(`Bien visto. ${msg || ''} Ya puedes continuar.`);
      if (!reducirMovimiento()) feedback.classList.add('feedback--brillo');
      ctx.hecho = true;
    },
    casi: (msg) => {
      feedback.classList.remove('feedback--brillo');
      sonido.casi();
      feedback.replaceChildren(dialogoGuia(msg, { nombre: guia(c).nombre, tono: 'casi', titulo: `↺ ${elegir(guia(c).casi)}`, compacto: true }));
      anunciar(`Miremos juntos. ${msg}`);
    },
  };

  const cuerpo = render ? render(act, ctx) : h('p', {}, `Tipo de actividad desconocido: ${act.tipo}`);

  let pistas = null;
  if (act.pistas?.length && act.tipo !== 'constructor') {
    let n = 0;
    const lista = h('ol', { class: 'pistas' });
    const btn = h('button', { type: 'button', class: 'btn btn--pista', onclick: () => {
      lista.appendChild(h('li', { html: md(act.pistas[n]) }));
      n += 1;
      ctx.pista();
      sonido.pista();
      btn.disabled = n >= act.pistas.length;
      btn.textContent = btn.disabled ? '💡 No hay más pistas' : `💡 Otra pista (${n + 1}/${act.pistas.length})`;
    } }, `💡 Pedir pista (1/${act.pistas.length})`);
    pistas = h('div', { class: 'zona-pistas' }, btn, lista);
  }

  const anterior = i > 0
    ? h('a', { class: 'btn', href: ruta(m, nivel, i) }, '← Anterior')
    : h('a', { class: 'btn', href: ruta(m, nivel) }, '← Nivel');

  return h('div', { class: `vista vista-actividad color-${m.color || 'naranja'}` },
    migas(m, `${nombreNivel(m, nivel)}`),
    h('div', { class: 'hud' },
      h('p', { class: 'hud__nivel' }, rotulo(`${nombreNivel(m, nivel)} · ${nivel.titulo}`)),
      pasosNivel(m, nivel, i),
      kolb(c.sitio.fases, act.fase)),
    h('article', { class: 'actividad' },
      h('p', { class: 'actividad__num' }, `Actividad ${i + 1} de ${nivel.actividades.length}`),
      h('h1', { tabindex: '-1', class: 'actividad__titulo' }, act.titulo),
      h('div', { class: 'consigna', html: md(act.consigna) }),
      hechoAntes ? h('p', { class: 'nota' }, '★ Ya completaste esta actividad. Puedes repetirla o continuar.') : null,
      act.apoyo && act.tipo !== 'seleccion' ? apoyo(act.apoyo) : null,
      cuerpo,
      act.tema ? recordemos(m, act.tema) : null,
      pistas,
      feedback,
      explicacion),
    h('nav', { class: 'nav-actividad', 'aria-label': 'Navegación de la actividad' }, anterior, continuar),
    notaContinuar);
}

function fin(c, m, nivel) {
  const pendientes = nivel.actividades.filter((a) => !store.actividadHecha(m.numero, a.id));
  if (pendientes.length) {
    return h('div', { class: 'vista' }, migas(m, `${nombreNivel(m, nivel)}`),
      h('h1', { tabindex: '-1' }, 'Te faltan algunas actividades'),
      h('ul', {}, pendientes.map((a) => h('li', {}, h('a', { href: ruta(m, nivel, nivel.actividades.indexOf(a) + 1) }, a.titulo)))));
  }
  const nuevoNivel = store.marcarNivel(m.numero, nivel.numero);
  const todos = misionTerminada(m, store.nivelHecho);
  const nuevaMision = todos && store.marcarMision(m.numero);
  if (nuevoNivel) aviso(`+${c.sitio.puntos.nivel} puntos`);
  setTimeout(() => (nuevaMision ? sonido.insignia() : sonido.nivel()), 150);

  const siguiente = m.niveles.find((n) => n.numero === nivel.numero + 1 && n.casoClave === nivel.casoClave);
  const pantalla = h('div', { class: 'vista vista-fin' }, migas(m, `${nombreNivel(m, nivel)}`),
    h('div', { class: `pantalla-nivel pantalla-nivel--fin color-${m.color || 'naranja'}` },
      h('div', { class: 'pantalla-nivel__sprite', 'aria-hidden': 'true', html: miSprite(96, 'sprite--festeja') }),
      h('p', { class: 'pantalla-nivel__pre', 'aria-hidden': 'true' }, '★ ★ ★'),
      h('h1', { tabindex: '-1', class: 'pantalla-nivel__titulo nivel-superado' }, '¡NIVEL SUPERADO!'),
      dialogoGuia(nivel.cierre, { nombre: guia(c).nombre, tono: 'bien', titulo: elegir(guia(c).nivel) }),
      todos ? h('div', { class: 'premio' },
        h('div', { class: nuevaMision ? 'insignia-gira' : '' }, insignia(m, true, 120)),
        h('h2', {}, nuevaMision ? '¡Ganaste una insignia!' : 'Insignia de la misión'),
        h('p', {}, h('strong', {}, m.insignia.nombre)),
        h('p', {}, m.insignia.descripcion),
        nuevaMision ? h('p', { class: 'nota' }, `+${c.sitio.puntos.mision} puntos`) : null,
        accesorioDeMision(m.numero) ? h('p', { class: 'desbloqueo' }, `🎁 Desbloqueaste un accesorio para tu personaje: ${accesorioDeMision(m.numero).nombre.toLowerCase()}. `,
          h('a', { href: '#/personaje' }, 'Pruébalo')) : null) : null,
      h('div', { class: 'acciones acciones--envolver acciones--centro' },
        siguiente ? h('a', { class: 'btn btn--start', href: ruta(m, siguiente) }, `▶ ${nombreNivel(m, siguiente).toUpperCase()}`) : null,
        !siguiente && otroCaso(m) ? h('a', { class: 'btn btn--start', href: ruta(m, otroCaso(m)) }, '▶ PRACTICAR CON EL OTRO CASO') : null,
        todos ? h('button', { type: 'button', class: 'btn btn--primario', onclick: () => compartirInsignia({ mision: m, sprite: miSprite(96), nombreJugador: nombreJugador(), nombreSitio: c.sitio.nombre }) }, '📤 Compartir mi insignia') : null,
        todos ? h('a', { class: 'btn', href: `#/mision/${m.numero}/llevar` }, '🖨 Hoja para llevar') : null,
        h('a', { class: 'btn', href: `#/mision/${m.numero}` }, 'Volver a la misión'),
        todos ? h('a', { class: 'btn', href: '#/' }, 'Ir al mapa') : null)));
  if (nuevoNivel || nuevaMision) setTimeout(() => confeti(pantalla.querySelector('.pantalla-nivel'), nuevaMision ? 110 : 60), 100);
  return pantalla;
}
