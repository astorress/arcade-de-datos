import { h, md, pad2, rotulo } from '../util.js';
import * as store from '../store.js';
import { disponible, enPrevia, verCasoEnPrevia } from '../content.js';
import { insignia } from '../components/insignia.js';
import { leyendaKolb } from '../components/kolb.js';
import { dialogoGuia } from '../components/guia.js';

export function vistaMision(c, m) {
  const cabecera = h('header', { class: `cabecera-mision color-${m.color || 'naranja'}` },
    h('p', { class: 'cabecera-mision__num' }, rotulo(`Misión ${pad2(m.numero)} · Sesión ${m.numero}`)),
    h('h1', { tabindex: '-1' }, m.titulo),
    h('p', { class: 'cabecera-mision__sesion' }, m.sesion));

  if (!disponible(m)) {
    return h('div', { class: 'vista' }, migas(m), bandaPrevia(m), cabecera,
      h('section', { class: 'panel panel--pronto' },
        h('p', { class: 'pixel pronto' }, rotulo('Próximamente')),
        h('p', {}, 'Esta misión se publicará después de la sesión en vivo.'),
        h('dl', { class: 'ficha' },
          h('dt', {}, 'Caso ficticio'), h('dd', {}, m.caso),
          h('dt', {}, 'Lo que vas a practicar'), h('dd', {}, m.habilidad)),
        h('div', { class: 'centro' }, insignia(m, false, 96)),
        h('p', { class: 'centro' }, 'Insignia: ', h('strong', {}, m.insignia?.nombre || '')),
        m.teoria ? h('p', {}, 'Mientras tanto, ya puedes repasar la teoría de esta sesión.') : null,
        h('div', { class: 'acciones acciones--envolver' },
          m.teoria ? h('a', { class: 'btn btn--primario', href: `#/mision/${m.numero}/teoria` }, '📘 Guía de teoría') : null,
          h('a', { class: 'btn', href: '#/' }, '← Volver al mapa'))));
  }

  const completa = store.misionCompletada(m.numero);
  const listaNiveles = (lista) => h('ol', { class: 'niveles' }, lista.map((n) => {
    const hecho = store.nivelHecho(m.numero, n.numero);
    const hechas = n.actividades.filter((a) => store.actividadHecha(m.numero, a.id)).length;
    return h('li', { class: `nivel-item ${hecho ? 'nivel-item--hecho' : ''}` },
      h('a', { class: 'nivel-item__enlace', href: `#/mision/${m.numero}/nivel/${n.numero}` },
        h('span', { class: 'nivel-item__num' }, `NIVEL ${n.numeroEnCaso || n.numero}`),
        h('span', { class: 'nivel-item__titulo' }, n.titulo),
        h('span', { class: 'nivel-item__obj' }, n.objetivo),
        h('span', { class: 'nivel-item__estado' }, hecho ? '★ Completado · repetir' : hechas ? `▶ Continuar (${hechas}/${n.actividades.length})` : '▶ Jugar')));
  }));
  // Con varios casos a la vez: un bloque por caso, cada uno con su historia y sus niveles.
  const varios = m.grupos?.length > 1;
  const niveles = varios
    ? m.grupos.map((g, i) => h('section', { class: 'grupo-caso', 'aria-labelledby': `caso-${i}` },
      h('h3', { class: 'grupo-caso__titulo', id: `caso-${i}` }, rotulo(`Caso ${i + 1}`), ' · ', g.mision.titulo),
      dialogoGuia(g.mision.historia, { nombre: c.sitio.guia?.nombre, compacto: true, animado: false }),
      listaNiveles(g.mision.niveles)))
    : listaNiveles(m.niveles);

  return h('div', { class: 'vista' }, migas(m), bandaPrevia(m), cabecera,
    h('section', { 'aria-label': 'La historia' },
      m.numero === 1 && c.sitio.guia?.presentacion ? dialogoGuia(c.sitio.guia.presentacion, { nombre: c.sitio.guia.nombre, animado: false }) : null,
      dialogoGuia(m.historia, { nombre: c.sitio.guia?.nombre })),
    h('h2', { class: 'titulo-seccion' }, varios ? 'Elige un caso (o juega los dos)' : 'Niveles'),
    niveles,
    h('section', { class: 'panel panel--insignia' },
      insignia(m, completa, 88),
      h('div', {},
        h('h2', {}, completa ? '¡Insignia ganada!' : 'Insignia de esta misión'),
        h('p', {}, h('strong', {}, m.insignia.nombre)),
        h('p', {}, completa ? m.insignia.descripcion : varios ? 'Completa los niveles de cualquiera de los casos para ganarla.' : 'Completa los niveles para ganarla.'))),
    h('h2', { class: 'titulo-seccion' }, 'Herramientas de la misión'),
    h('div', { class: 'herramientas' },
      m.teoria ? herramienta(`#/mision/${m.numero}/teoria`, '📘', 'Guía de teoría', 'Recordemos: lo que ves en las clases asincrónicas y lo que necesitas para el reto.') : null,
      herramienta(`#/mision/${m.numero}/cuaderno`, '📓', 'Mi cuaderno', 'Lo que has escrito en esta misión. Para copiar o imprimir.'),
      herramienta(`#/mision/${m.numero}/llevar`, '🖨', 'Para llevar', 'Una hoja con la tabla, las definiciones y la consigna.'),
      herramienta('#/repaso', '⚡', 'Repaso relámpago', '5 preguntas al azar de lo que ya jugaste. Sin tiempo.'),
      herramienta(`#/clase/${m.numero}`, '📽', 'Modo clase', 'Para proyectar en la sesión: una pregunta por pantalla y votación por el chat.')),
    h('details', { class: 'conceptos' },
      h('summary', {}, '💡 Lo que aprendimos (ábrelo después de jugar)'),
      h('dl', {}, m.conceptos.flatMap((k) => [
        h('dt', {}, k.termino),
        h('dd', {}, h('span', { html: md(k.definicion) }), k.ejemplo ? h('span', { class: 'conceptos__ej' }, ` Ejemplo: ${k.ejemplo}`) : null)])),
      m.fraseClave ? h('p', { class: 'frase-clave' }, '«', m.fraseClave, '»') : null),
    h('details', { class: 'conceptos' },
      h('summary', {}, '🔄 ¿Cómo está armada cada misión?'),
      h('p', {}, 'Cada actividad está en una fase del ciclo de aprendizaje. Verás el indicador arriba de cada actividad:'),
      leyendaKolb(c.sitio.fases)));
}

/** Solo visible con ?previa: estado real de la misión y selector de caso. */
export function bandaPrevia(m) {
  if (!enPrevia()) return null;
  const casos = m.casosDisponibles || [];
  return h('aside', { class: 'banda-previa', 'aria-label': 'Vista previa del tutor' },
    h('strong', {}, '👀 Vista previa del tutor. '),
    m.estado === 'disponible' ? 'Los estudiantes ya ven esta misión.' : 'Los estudiantes todavía la ven bloqueada («Próximamente»).',
    casos.length > 1 ? h('div', { class: 'chips', role: 'group', 'aria-label': 'Caso que estás viendo' },
      [...casos, { clave: 'ambos', nombre: 'Ambos casos' }].map((c) => h('button', {
        type: 'button', class: `btn ${c.clave === m.casoClave ? 'btn--primario' : ''}`, 'aria-pressed': String(c.clave === m.casoClave),
        onclick: () => verCasoEnPrevia(m.numero, c.clave),
      }, `${c.clave === m.casoActivo ? '● ' : ''}${c.nombre}`))) : null,
    casos.length > 1 ? h('p', { class: 'nota' }, `● = caso activo para los estudiantes ("casoActivo": "${m.casoActivo}").`) : null,
    h('p', { class: 'nota' }, h('a', { href: '?previa=0#/' }, 'Salir de la vista previa')));
}

function herramienta(href, icono, titulo, texto) {
  return h('a', { class: 'herramienta', href }, h('span', { class: 'herramienta__icono', 'aria-hidden': 'true' }, icono), h('span', { class: 'herramienta__titulo' }, titulo), h('span', { class: 'herramienta__texto' }, texto));
}

export function migas(m, extra) {
  return h('nav', { class: 'migas', 'aria-label': 'Ruta' },
    h('a', { href: '#/' }, 'Mapa'), ' › ',
    extra ? [h('a', { href: `#/mision/${m.numero}` }, `Misión ${m.numero}`), ' › ', h('span', {}, extra)] : h('span', {}, `Misión ${m.numero}`));
}
