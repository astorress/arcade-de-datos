import { h, md, rotulo } from '../util.js';
import * as store from '../store.js';
import { disponible } from '../content.js';
import { mundo } from '../components/mundo.js';
import { miSprite, nombreJugador } from './personaje.js';
import { misionesJugadas } from './repaso.js';

export function vistaMapa(c) {
  const { sitio, misiones } = c;
  const ganadas = misiones.filter((m) => store.misionCompletada(m.numero)).length;

  const aviso = store.obtener().avisoVisto ? null : h('section', { class: 'aviso-inicial', 'aria-labelledby': 'aviso-titulo' },
    h('h2', { id: 'aviso-titulo' }, '🔐 Antes de empezar'),
    h('p', {}, sitio.avisoPrivacidad),
    h('p', {}, sitio.avisoDatos),
    h('button', { type: 'button', class: 'btn btn--primario', onclick: (e) => { store.marcarAvisoVisto(); e.target.closest('section').remove(); } }, 'Entendido'));

  const portada = h('header', { class: 'portada' },
    h('a', { class: 'portada__jugador', href: '#/personaje', 'aria-label': `Tu personaje, ${nombreJugador()}. Personalizar` },
      h('span', { class: 'portada__sprite', html: miSprite(64) }),
      h('span', { class: 'portada__pre' }, `★ ${rotulo(nombreJugador())} ★`),
      h('span', { class: 'portada__editar' }, '✏ Personalizar')),
    h('h1', { class: 'portada__titulo', tabindex: '-1' }, sitio.nombre),
    h('p', { class: 'portada__sub' }, sitio.subtitulo),
    h('p', { class: 'portada__desc' }, sitio.descripcion),
    h('p', { class: 'portada__start' }, h('a', { class: 'btn btn--start', href: `#/mision/${primeraPendiente(misiones)}` }, '▶ PRESIONA START')),
    misionesJugadas(c).length ? h('p', {}, h('a', { class: 'btn', href: '#/repaso' }, '⚡ Repaso relámpago')) : null,
    h('p', { class: 'portada__marcador' }, `Insignias: ${ganadas} / ${misiones.length}`));

  const bienvenida = sitio.bienvenida ? h('details', { class: 'bienvenida', open: !store.obtener().avisoVisto },
    h('summary', {}, '💬 ', sitio.bienvenida.titulo),
    sitio.bienvenida.parrafos.map((t) => h('p', { html: md(t) }))) : null;

  const actual = primeraPendiente(misiones);
  const info = misiones.map((m) => {
    const abierta = disponible(m);
    const completa = store.misionCompletada(m.numero);
    const totalNiveles = m.niveles?.length || 0;
    const nivelesHechos = (m.niveles || []).filter((n) => store.nivelHecho(m.numero, n.numero)).length;
    const estado = completa ? '★ Completada' : abierta ? (nivelesHechos ? `En curso · ${nivelesHechos}/${totalNiveles}` : 'Disponible') : (m.teoria ? 'Próximamente · teoría lista' : 'Próximamente');
    return { m, abierta, completa, estado, nivelesHechos, totalNiveles };
  });
  const camino = mundo(info, actual, miSprite(36));
  const visto = store.mapaVisto();
  const posActual = misiones.findIndex((x) => x.numero === actual) + 1;
  if (visto !== posActual) {
    // Espera a que el mapa esté en pantalla para medir el camino.
    const iniciar = () => { if (camino.isConnected) camino.caminar(visto); else requestAnimationFrame(iniciar); };
    requestAnimationFrame(iniciar);
    store.guardarMapaVisto(posActual);
  }

  return h('div', { class: 'vista vista-mapa' }, portada, bienvenida, aviso,
    h('h2', { class: 'titulo-seccion' }, 'Mapa de misiones'),
    h('p', { class: 'nota' }, 'Una misión por sesión. Toca un punto del mapa para entrar; puedes ir a cualquier misión publicada en el orden que quieras.'),
    camino);
}

function primeraPendiente(misiones) {
  const m = misiones.find((x) => disponible(x) && !store.misionCompletada(x.numero)) || misiones.find(disponible) || misiones[0];
  return m?.numero ?? 1;
}
