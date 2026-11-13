import { h, md, plano, copiar, aviso, imprimir } from '../util.js';
import * as store from '../store.js';
import { disponible, claveTexto } from '../content.js';
import { tarjetaInsignia } from '../components/insignia.js';
import { leyendaKolb } from '../components/kolb.js';
import { migas } from './mision.js';
import { miSprite, nombreJugador } from './personaje.js';
import { misionesJugadas } from './repaso.js';
import { compartirInsignia } from '../components/compartir.js';

// ---------- Glosario (álbum de cartas) ----------
export function vistaGlosario(c) {
  const normal = (x) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const terminos = [...c.glosario].sort((x, y) => x.termino.localeCompare(y.termino, 'es'));
  const jugadas = new Set(misionesJugadas(c).map((m) => m.numero));
  const colorDe = (n) => c.misiones.find((m) => m.numero === n)?.color || 'naranja';
  const coleccionada = (t) => !t.mision || jugadas.has(t.mision);
  const total = terminos.length;
  const tengo = terminos.filter(coleccionada).length;

  const album = h('ul', { class: 'album', 'aria-label': 'Cartas del glosario' });
  const vacio = h('p', { class: 'nota', hidden: true }, 'No encontramos ese término. Prueba con otra palabra.');

  const carta = (t) => {
    const mia = coleccionada(t);
    return h('li', { class: `carta color-${colorDe(t.mision)} ${mia ? 'carta--mia' : 'carta--pendiente'}` },
      h('div', { class: 'carta__cabeza' },
        h('span', { class: 'carta__mision' }, t.mision ? `M${t.mision}` : '★'),
        h('span', { class: 'carta__estado' }, mia ? '✓ Coleccionada' : `Juega la Misión ${t.mision} para coleccionarla`)),
      h('h2', { class: 'carta__termino' }, t.termino),
      h('p', { class: 'carta__def', html: md(t.definicion) }),
      t.ejemplo ? h('p', { class: 'carta__ej' }, h('strong', {}, 'Ejemplo: '), t.ejemplo) : null);
  };

  const pintar = (q = '') => {
    const nq = normal(q.trim());
    const visibles = terminos.filter((t) => !nq || normal(`${t.termino} ${t.definicion}`).includes(nq));
    album.replaceChildren(...visibles.map(carta));
    vacio.hidden = visibles.length > 0;
  };

  const buscador = h('input', { type: 'search', id: 'buscar-glosario', class: 'campo', placeholder: 'Ej.: variable, fila, identificador…', oninput: (e) => pintar(e.target.value) });
  pintar();
  return h('div', { class: 'vista' },
    h('h1', { tabindex: '-1' }, 'Glosario'),
    h('p', {}, 'Las palabras del curso, como cartas coleccionables. Todas se pueden leer siempre; las coleccionas al jugar la misión donde aparecen.'),
    h('div', { class: 'contador-cartas', role: 'img', 'aria-label': `Cartas coleccionadas: ${tengo} de ${total}` },
      h('span', { class: 'contador-cartas__num', 'aria-hidden': 'true' }, `${tengo}/${total}`),
      h('span', { 'aria-hidden': 'true' }, ' cartas coleccionadas'),
      h('span', { class: 'barra contador-cartas__barra', 'aria-hidden': 'true' }, h('span', { class: 'contador-cartas__lleno', style: `width:${total ? (tengo / total) * 100 : 0}%` }))),
    h('label', { for: 'buscar-glosario', class: 'etiqueta' }, 'Buscar'),
    buscador, vacio, album);
}

// ---------- Mi progreso ----------
export function vistaProgreso(c) {
  const puntos = store.puntos(c.sitio.puntos);
  const publicadas = c.misiones.filter(disponible);

  const confirmar = h('div', { class: 'confirmar', hidden: true },
    h('p', {}, '¿Seguro? Se borrarán tus niveles, insignias, tu personaje y todo lo que escribiste en tu cuaderno. No se puede deshacer.'),
    h('div', { class: 'acciones acciones--envolver' },
      h('button', { type: 'button', class: 'btn btn--peligro', onclick: () => { store.borrarTodo(); aviso('Progreso borrado.'); location.hash = '#/progreso'; window.dispatchEvent(new HashChangeEvent('hashchange')); } }, 'Sí, borrar todo'),
      h('button', { type: 'button', class: 'btn', onclick: () => { confirmar.hidden = true; } }, 'Cancelar')));

  return h('div', { class: 'vista' },
    h('h1', { tabindex: '-1' }, 'Mi progreso'),
    h('div', { class: 'marcador' },
      h('div', { class: 'marcador__dato' }, h('span', { class: 'marcador__valor' }, String(puntos).padStart(4, '0')), h('span', {}, 'puntos')),
      h('div', { class: 'marcador__dato' }, h('span', { class: 'marcador__valor' }, String(c.misiones.filter((m) => store.misionCompletada(m.numero)).length)), h('span', {}, 'insignias'))),
    h('p', { class: 'nota' }, 'Los puntos premian completar y comprender, no la rapidez. Pedir pistas o equivocarte nunca resta. No hay ranking: este progreso es solo tuyo.'),
    h('a', { class: 'tarjeta-jugador', href: '#/personaje' },
      h('span', { html: miSprite(56) }),
      h('span', {}, h('strong', {}, nombreJugador()), h('span', { class: 'nota' }, ' · Personalizar mi personaje →'))),
    h('h2', { class: 'titulo-seccion' }, 'Insignias'),
    h('div', { class: 'insignias' }, c.misiones.map((m) => {
      const ganada = store.misionCompletada(m.numero);
      const t = tarjetaInsignia(m, ganada);
      if (ganada) t.appendChild(h('button', { type: 'button', class: 'btn btn--mini', onclick: () => compartirInsignia({ mision: m, sprite: miSprite(96), nombreJugador: nombreJugador(), nombreSitio: c.sitio.nombre }) }, '📤 Compartir'));
      return t;
    })),
    h('h2', { class: 'titulo-seccion' }, 'Niveles'),
    publicadas.length ? h('ul', { class: 'lista-niveles' }, publicadas.flatMap((m) => m.niveles.map((n) =>
      h('li', {}, h('span', { 'aria-hidden': 'true' }, store.nivelHecho(m.numero, n.numero) ? '★ ' : '☆ '),
        `Misión ${m.numero} · Nivel ${n.numero}: ${n.titulo}`,
        h('span', { class: 'sr-only' }, store.nivelHecho(m.numero, n.numero) ? ' (completado)' : ' (pendiente)'))))) : null,
    h('section', { class: 'panel' },
      h('h2', {}, '🔐 Tus datos'),
      h('p', {}, c.sitio.avisoPrivacidad),
      store.almacenamientoDisponible() ? null : h('p', { class: 'fb fb--casi' }, 'Este navegador no permite guardar datos (quizá estás en modo privado). Puedes jugar igual, pero el progreso se perderá al cerrar la página.'),
      h('button', { type: 'button', class: 'btn btn--peligro', onclick: () => { confirmar.hidden = false; } }, '🗑 Borrar mi progreso'),
      confirmar));
}

// ---------- Ayuda ----------
export function vistaAyuda(c) {
  return h('div', { class: 'vista prosa' },
    h('h1', { tabindex: '-1' }, 'Cómo usar esta página'),
    h('p', {}, c.sitio.descripcion),
    c.sitio.bienvenida ? [h('h2', {}, `💬 ${c.sitio.bienvenida.titulo}`), c.sitio.bienvenida.parrafos.map((t) => h('p', { html: md(t) }))] : null,
    h('h2', {}, '🕹 Cómo se juega'),
    h('ol', {},
      h('li', {}, 'En el ', h('a', { href: '#/' }, 'mapa'), ' eliges una misión. Hay una por cada sesión en vivo.'),
      h('li', {}, 'Cada misión tiene 3 niveles. Cada nivel tiene actividades cortas: primero haces, después entiendes.'),
      h('li', {}, 'Si te equivocas, la página te explica por qué y te da el siguiente paso. Equivocarse es parte de aprender.'),
      h('li', {}, 'Puedes pedir pistas cuando quieras. No restan puntos.'),
      h('li', {}, 'Al terminar una misión ganas una insignia.')),
    h('h2', {}, '🔄 El ciclo de cada misión'),
    leyendaKolb(c.sitio.fases),
    h('h2', {}, '🧑‍🎤 Tu personaje'),
    h('p', {}, 'Toca tu personaje (arriba a la derecha o en la portada) para cambiar su ropa, su pelo y su accesorio. Cada insignia que ganas desbloquea un accesorio nuevo.'),
    h('h2', {}, '📓 Cuaderno y hojas para imprimir'),
    h('p', {}, 'Lo que escribes queda en «Mi cuaderno» de cada misión. Puedes copiarlo o imprimirlo. También puedes trabajar en un cuaderno de papel: siempre hay una casilla para decir que lo hiciste en papel.'),
    h('h2', {}, '🔐 Privacidad'),
    h('p', {}, c.sitio.avisoPrivacidad),
    h('p', {}, c.sitio.avisoDatos),
    h('h2', {}, '⚙ Ajustes'),
    h('p', {}, 'Con el botón «Ajustes» de arriba puedes cambiar el tamaño de la letra, el modo claro u oscuro, activar los sonidos 8-bit (vienen apagados) y quitar el efecto retro de la pantalla.'),
    h('h2', {}, 'Sobre esta página'),
    h('p', {}, c.sitio.autoria),
    c.sitio.padlet ? h('p', {}, '📌 Muro del grupo para dejar dudas y hallazgos: ', h('a', { href: c.sitio.padlet, target: '_blank', rel: 'noopener' }, 'abrir el Padlet')) : null,
    h('p', { class: 'nota' }, 'Tipografía pixel: «Jersey 10» de Sarah Cadigan-Fried, licencia SIL Open Font License.'));
}

// ---------- Para llevar ----------
export function vistaLlevar(c, mision) {
  const hoja = () => h('div', {}, (mision.grupos || [{ mision }]).map((g) => hojaCaso(c, g.mision)));
  return vistaLlevarCon(c, mision, hoja);
}

function hojaCaso(c, m) {
    const pl = m.paraLlevar || {};
    return h('div', { class: 'hoja' },
      h('p', { class: 'hoja__pre' }, `${c.sitio.nombre} · Misión ${m.numero}`),
      h('h1', { tabindex: '-1' }, `${m.titulo}: ${m.sesion}`),
      h('table', { class: 'tabla tabla--hoja' },
        h('caption', {}, `${m.datos.titulo} (datos ficticios)`),
        h('thead', {}, h('tr', {}, m.datos.columnas.map((col) => h('th', { scope: 'col' }, col)))),
        h('tbody', {}, m.datos.filas.map((f) => h('tr', {}, f.map((v) => h('td', {}, v)))))),
      h('h2', {}, 'Así se lee la tabla'),
      h('ul', {}, m.datos.definiciones.map((d) => h('li', {}, plano(d))), h('li', {}, m.datos.aviso)),
      pl.consigna ? [h('h2', {}, 'El reto'), h('p', {}, pl.consigna)] : null,
      pl.pasos ? h('ol', {}, pl.pasos.map((p) => h('li', {}, p))) : null,
      pl.lupa ? [h('h2', {}, `La lupa: ${(pl.lupaTitulo || 'Una buena pregunta…').replace(/^./, (c) => c.toLowerCase())}`), h('ul', { class: 'lista-check' }, pl.lupa.map((x) => h('li', {}, x)))] : null,
      m.fraseClave ? h('p', { class: 'frase-clave' }, '«', m.fraseClave, '»') : null);
}

function vistaLlevarCon(c, m, hoja) {
  return h('div', { class: 'vista' }, migas(m, 'Para llevar'),
    h('div', { class: 'acciones acciones--envolver' },
      h('button', { type: 'button', class: 'btn btn--primario', onclick: () => imprimir(hoja()) }, '🖨 Imprimir o guardar como PDF'),
      (m.grupos || [{ clave: 'unico', mision: m }]).map((g, i, todos) => h('button', { type: 'button', class: 'btn', onclick: () => descargarCSV(g.mision, g.clave) },
        todos.length > 1 ? `⬇ Tabla del caso ${i + 1} (CSV)` : '⬇ Descargar la tabla (CSV)'))),
    h('p', { class: 'nota' }, 'En el celular: al imprimir, elige «Guardar como PDF» para tenerla sin conexión. El CSV se abre en Excel, Google Sheets o Python.'),
    h('div', { class: 'hoja-previa' }, hoja()));
}

/** Descarga la tabla del caso como CSV (separado por «;», como lo abre Excel en español). */
function descargarCSV(m, clave) {
  const celda = (v) => (/[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const filas = [m.datos.columnas, ...m.datos.filas].map((f) => f.map(celda).join(';'));
  const blob = new Blob(['\uFEFF' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `mision-${String(m.numero).padStart(2, '0')}${clave && clave !== 'unico' ? `-${clave}` : ''}.csv` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- Mi cuaderno ----------
export function vistaCuaderno(c, m) {
  const textos = store.obtener().cuaderno[String(m.numero)] || {};
  const etiquetas = {};
  const varios = m.grupos?.length > 1;
  (m.niveles || []).forEach((n) => n.actividades.forEach((a) => {
    const pre = varios ? `Caso ${m.grupos.findIndex((g) => g.clave === n.casoClave) + 1} · ` : '';
    const poner = (k, titulo) => { etiquetas[claveTexto(n, k)] = `${pre}${titulo}`; };
    if (a.textoLibre) poner(a.textoLibre.clave, a.titulo);
    (a.pasos || []).forEach((p) => poner(`reto-${p.clave}`, `Reto · ${p.titulo}`));
    (a.frases || []).forEach((f) => poner(f.clave, f.inicio));
  }));
  const t = (k) => (textos[k] || '').trim();
  const entradas = Object.keys(etiquetas).filter((k) => t(k)).map((k) => ({ titulo: etiquetas[k], texto: t(k) }));
  const comoTexto = () => [`MI CUADERNO · Misión ${m.numero}: ${m.titulo}`, ...entradas.map((e) => `${e.titulo}\n${e.texto}`)].join('\n\n');
  const hoja = () => h('div', { class: 'hoja' }, h('h1', {}, `Mi cuaderno · Misión ${m.numero}: ${m.titulo}`),
    entradas.map((e) => h('section', {}, h('h2', {}, e.titulo), h('p', { class: 'hoja__respuesta' }, e.texto))));

  return h('div', { class: 'vista' }, migas(m, 'Mi cuaderno'),
    h('h1', { tabindex: '-1' }, '📓 Mi cuaderno'),
    h('p', { class: 'nota' }, 'Solo lo ves tú, en este navegador. Llévalo a clase copiándolo o imprimiéndolo.'),
    entradas.length
      ? [h('div', { class: 'acciones acciones--envolver' },
          h('button', { type: 'button', class: 'btn btn--primario', onclick: async () => aviso((await copiar(comoTexto())) ? 'Cuaderno copiado.' : 'No se pudo copiar.') }, '📋 Copiar todo'),
          h('button', { type: 'button', class: 'btn', onclick: () => imprimir(hoja()) }, '🖨 Imprimir')),
        h('div', { class: 'cuaderno' }, entradas.map((e) => h('section', { class: 'cuaderno__entrada' }, h('h2', {}, e.titulo), h('p', {}, e.texto))))]
      : h('p', { class: 'panel' }, 'Todavía no has escrito nada en esta misión. Lo que escribas en las actividades aparecerá aquí.'));
}
