import { h, md, plano, imprimir, rotulo } from '../util.js';
import { migas } from './mision.js';

const RELACION = {
  aplica: () => ({ icono: '✔', texto: 'Lo ves en las clases asincrónicas esta misma semana' }),
  anticipa: (s) => ({ icono: '⏩', texto: `Las clases asincrónicas lo ven más adelante (semana ${s}). Aquí tienes una base` }),
  retoma: (s) => ({ icono: '↩', texto: `Ya lo viste en las clases asincrónicas (semana ${s}). Aquí lo pones en práctica` }),
};

export function vistaTeoria(c, m) {
  const t = m.teoria;
  const temas = t.temas || [];

  const indice = h('ol', { class: 'indice-teoria' }, temas.map((tema) =>
    h('li', {}, h('button', { type: 'button', class: 'enlace-boton', onclick: () => {
      const destino = document.getElementById(`tema-${tema.id}`);
      destino?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      destino?.focus({ preventScroll: true });
    } }, tema.titulo))));

  const porCurso = {};
  (t.platzi || []).forEach((p) => { (porCurso[p.curso] ||= []).push(p); });

  const platzi = Object.entries(porCurso).map(([curso, modulos]) => h('section', { class: 'curso-platzi' },
    h('h3', {}, curso),
    modulos.map((p) => {
      const r = (RELACION[p.relacion] || RELACION.aplica)(p.semanaPlatzi);
      return h('div', { class: `modulo-platzi modulo-platzi--${p.relacion}` },
        h('p', { class: 'modulo-platzi__nombre' }, p.modulo),
        h('p', { class: 'modulo-platzi__relacion' }, h('span', { 'aria-hidden': 'true' }, `${r.icono} `), r.texto),
        h('ul', {}, p.contenidos.map((x) => h('li', {}, x))));
    })));

  const tarjetas = temas.map((tema, i) => h('article', { class: 'tema', id: `tema-${tema.id}`, tabindex: '-1' },
    h('p', { class: 'tema__num' }, `TEMA ${i + 1}`),
    h('h2', { class: 'tema__titulo' }, tema.titulo),
    h('p', { class: 'tema__idea', html: md(tema.idea) }),
    h('p', { html: md(tema.explicacion) }),
    tema.cotidiano ? h('div', { class: 'tema__caja tema__caja--vida' }, h('p', { class: 'tema__etiqueta' }, '🏠 En tu vida diaria'), h('p', { html: md(tema.cotidiano) })) : null,
    tema.ejemplo ? h('div', { class: 'tema__caja' }, h('p', { class: 'tema__etiqueta' }, '🧪 Ejemplo (datos ficticios)'), h('p', { html: md(tema.ejemplo) })) : null,
    tema.enElReto ? h('div', { class: 'tema__caja tema__caja--reto' }, h('p', { class: 'tema__etiqueta' }, '🎯 Para el reto'), h('p', { html: md(tema.enElReto) })) : null));

  const hojaImprimible = () => h('div', { class: 'hoja' },
    h('h1', {}, `Guía de teoría · Misión ${m.numero}: ${m.titulo}`),
    h('p', {}, plano(t.intro)),
    temas.map((tema) => h('section', {}, h('h2', {}, tema.titulo), h('p', {}, plano(tema.idea)), h('p', {}, plano(tema.explicacion)),
      tema.cotidiano ? h('p', {}, `En tu vida diaria: ${plano(tema.cotidiano)}`) : null)),
    t.pasos?.length ? [h('h2', {}, 'Cómo abordar el reto'), h('ol', {}, t.pasos.map((x) => h('li', {}, plano(x))))] : null);

  return h('div', { class: 'vista vista-teoria' }, migas(m, 'Guía de teoría'),
    h('header', { class: `cabecera-mision color-${m.color || 'naranja'}` },
      h('p', { class: 'cabecera-mision__num' }, rotulo(`Guía de teoría · Misión ${String(m.numero).padStart(2, '0')}`)),
      h('h1', { tabindex: '-1' }, 'Recordemos'),
      h('p', { class: 'cabecera-mision__sesion' }, m.sesion)),
    h('p', { class: 'teoria-intro', html: md(t.intro) }),
    h('p', { class: 'nota' }, 'Puedes leerla antes de jugar, volver a ella cuando te trabes o repasarla después de la clase.'),
    temas.length ? [h('h2', { class: 'titulo-seccion' }, 'Temas'), indice] : null,
    platzi.length ? [
      h('h2', { class: 'titulo-seccion' }, 'Qué ves en las clases asincrónicas'),
      h('p', { class: 'nota' }, 'Estás en uno de estos cursos. Busca el tuyo: no necesitas haber visto el módulo para jugar la misión.'),
      h('div', { class: 'cursos-platzi' }, platzi)] : null,
    t.ampliacion?.length ? h('div', { class: 'panel panel--vivo' },
      h('h2', {}, '🎙 Lo trabajamos en la clase en vivo'),
      h('p', { class: 'nota' }, 'Estos temas no aparecen de forma explícita en las clases asincrónicas: los construimos juntos en la sesión.'),
      h('ul', {}, t.ampliacion.map((x) => h('li', { html: md(x) })))) : null,
    tarjetas,
    t.pasos?.length ? h('section', { class: 'panel' },
      h('h2', {}, '🧭 Cómo abordar el reto'),
      h('ol', { class: 'pasos-reto' }, t.pasos.map((x) => h('li', { html: md(x) })))) : null,
    t.errores?.length ? h('section', { class: 'panel' },
      h('h2', {}, '💡 Errores que nos enseñan'),
      h('p', { class: 'nota' }, 'Equivocarse es parte del juego. Estos son los tropiezos más comunes y cómo salir de ellos.'),
      h('dl', { class: 'errores' }, t.errores.flatMap((e) => [h('dt', { html: md(e.error) }), h('dd', { html: md(e.consejo) })]))) : null,
    h('div', { class: 'acciones acciones--envolver' },
      h('button', { type: 'button', class: 'btn', onclick: () => imprimir(hojaImprimible()) }, '🖨 Imprimir la guía'),
      h('a', { class: 'btn btn--primario', href: `#/mision/${m.numero}` }, 'Ir a la misión →')));
}

/** Caja plegable "Recordemos" dentro de una actividad. */
export function recordemos(m, idTema) {
  const tema = m.teoria?.temas?.find((x) => x.id === idTema);
  if (!tema) return null;
  return h('details', { class: 'recordemos' },
    h('summary', {}, '📘 Recordemos: ', tema.titulo),
    h('p', { class: 'tema__idea', html: md(tema.idea) }),
    h('p', { html: md(tema.explicacion) }),
    tema.cotidiano ? h('p', {}, h('strong', {}, 'En tu vida diaria: '), h('span', { html: md(tema.cotidiano) })) : null,
    h('p', {}, h('a', { href: `#/mision/${m.numero}/teoria` }, 'Ver la guía de teoría completa →')));
}
