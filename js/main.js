import { h } from './util.js';
import * as store from './store.js';
import { cargarTodo, buscarMision, disponible } from './content.js';
import { vistaMapa } from './views/mapa.js';
import { vistaMision } from './views/mision.js';
import { vistaNivel } from './views/nivel.js';
import { vistaGlosario, vistaProgreso, vistaAyuda, vistaLlevar, vistaCuaderno } from './views/extras.js';
import { vistaTeoria } from './views/teoria.js';
import { vistaRepaso } from './views/repaso.js';
import { vistaClase } from './views/clase.js';
import { vistaPersonaje, miSprite } from './views/personaje.js';
import { sonido } from './sonido.js';
import { iconificarSiempre } from './components/iconificar.js';

const app = document.getElementById('app');
let contenido;

// ---------- Ajustes de pantalla ----------
const TAMANOS = [1, 1.15, 1.3, 1.45];

function aplicarAjustes() {
  const a = store.ajustes();
  const raiz = document.documentElement;
  if (a.tema === 'sistema') raiz.removeAttribute('data-theme');
  else raiz.setAttribute('data-theme', a.tema);
  raiz.style.setProperty('--escala', String(TAMANOS[a.letra] ?? 1));
  raiz.classList.toggle('sin-retro', !a.retro);
  const pts = document.getElementById('hud-puntos');
  if (pts && contenido) pts.textContent = String(store.puntos(contenido.sitio.puntos)).padStart(4, '0');
  const hud = document.getElementById('hud-personaje');
  if (hud) hud.innerHTML = miSprite(30);
}

function panelAjustes() {
  const panel = document.getElementById('panel-ajustes');
  const a = store.ajustes();
  const grupo = (titulo, nombre, opciones, actual, al) => h('fieldset', { class: 'ajuste' },
    h('legend', {}, titulo),
    h('div', { class: 'chips' }, opciones.map(([valor, texto]) => {
      const id = `aj-${nombre}-${valor}`;
      const input = h('input', { type: 'radio', name: `aj-${nombre}`, id, onchange: () => { al(valor); aplicarAjustes(); } });
      if (String(actual) === String(valor)) input.checked = true;
      return h('label', { class: 'chip', for: id }, input, h('span', {}, texto));
    })));
  panel.replaceChildren(
    h('h2', { class: 'panel-ajustes__titulo' }, 'Ajustes'),
    grupo('Tamaño de letra', 'letra', [[0, 'A'], [1, 'A+'], [2, 'A++'], [3, 'A+++']], a.letra, (v) => store.guardarAjuste('letra', Number(v))),
    grupo('Colores', 'tema', [['sistema', 'Automático'], ['dark', 'Oscuro'], ['light', 'Claro']], a.tema, (v) => store.guardarAjuste('tema', v)),
    grupo('Sonidos 8-bit', 'sonido', [['no', 'Apagados'], ['si', 'Activados']], a.sonido ? 'si' : 'no', (v) => { store.guardarAjuste('sonido', v === 'si'); if (v === 'si') sonido.prueba(); }),
    grupo('Efecto retro (líneas de pantalla)', 'retro', [['si', 'Activado'], ['no', 'Desactivado']], a.retro ? 'si' : 'no', (v) => store.guardarAjuste('retro', v === 'si')),
    h('button', { type: 'button', class: 'btn', onclick: cerrarAjustes }, 'Cerrar'));
}

function abrirAjustes() {
  const panel = document.getElementById('panel-ajustes');
  panelAjustes();
  panel.hidden = false;
  document.getElementById('btn-ajustes').setAttribute('aria-expanded', 'true');
  panel.querySelector('input:checked, input')?.focus();
}

function cerrarAjustes() {
  const panel = document.getElementById('panel-ajustes');
  panel.hidden = true;
  const btn = document.getElementById('btn-ajustes');
  btn.setAttribute('aria-expanded', 'false');
  btn.focus();
}

// ---------- Rutas ----------
function resolver(hash) {
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [seccion, n, sub, nivel, paso] = partes;
  if (!seccion) return { nav: 'mapa', vista: () => vistaMapa(contenido) };
  if (seccion === 'glosario') return { nav: 'glosario', vista: () => vistaGlosario(contenido) };
  if (seccion === 'progreso') return { nav: 'progreso', vista: () => vistaProgreso(contenido) };
  if (seccion === 'ayuda') return { nav: 'ayuda', vista: () => vistaAyuda(contenido) };
  if (seccion === 'repaso') return { nav: 'mapa', vista: () => vistaRepaso(contenido) };
  if (seccion === 'clase') {
    const mc = buscarMision(contenido, n);
    if (mc && disponible(mc)) return { nav: 'clase', vista: () => vistaClase(contenido, mc, sub) };
    return null;
  }
  if (seccion === 'personaje') return { nav: 'personaje', vista: () => vistaPersonaje(contenido) };
  if (seccion === 'mision') {
    const m = buscarMision(contenido, n);
    if (!m) return null;
    if (!sub) return { nav: 'mapa', vista: () => vistaMision(contenido, m) };
    if (sub === 'teoria' && m.teoria) return { nav: 'mapa', vista: () => vistaTeoria(contenido, m) };
    if (!disponible(m)) return { nav: 'mapa', vista: () => vistaMision(contenido, m) };
    if (sub === 'nivel') return { nav: 'mapa', vista: () => vistaNivel(contenido, m, sub && nivel, paso) };
    if (sub === 'llevar') return { nav: 'mapa', vista: () => vistaLlevar(contenido, m) };
    if (sub === 'cuaderno') return { nav: 'mapa', vista: () => vistaCuaderno(contenido, m) };
  }
  return null;
}

function noEncontrada() {
  return h('div', { class: 'vista' },
    h('h1', { tabindex: '-1' }, 'GAME OVER… es broma 🙂'),
    h('p', {}, 'No encontramos esta página. Vuelve al mapa para seguir jugando.'),
    h('a', { class: 'btn btn--primario', href: '#/' }, 'Ir al mapa'));
}

let vistaActual = null;

function pintar() {
  const r = resolver(location.hash);
  vistaActual?.limpiar?.();
  let vista = null;
  try {
    vista = r ? r.vista() : null;
  } catch (e) {
    console.error(e);
  }
  vistaActual = vista;
  app.replaceChildren(vista || noEncontrada());
  document.querySelectorAll('.nav-principal a').forEach((a) => {
    if (a.dataset.nav === r?.nav) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const titulo = app.querySelector('h1');
  document.title = `${titulo ? `${titulo.textContent} · ` : ''}${contenido.sitio.nombre}`;
  window.scrollTo(0, 0);
  if (titulo && document.body.dataset.listo) titulo.focus({ preventScroll: true });
  document.body.dataset.listo = '1';
  aplicarAjustes();
}

// ---------- Arranque ----------
async function iniciar() {
  store.iniciar();
  aplicarAjustes();
  try {
    contenido = await cargarTodo();
  } catch (e) {
    console.error(e);
    app.replaceChildren(h('div', { class: 'vista' },
      h('h1', {}, 'No pudimos cargar las misiones'),
      h('p', {}, 'Revisa tu conexión y vuelve a cargar la página.'),
      h('button', { class: 'btn btn--primario', onclick: () => location.reload() }, 'Volver a cargar')));
    return;
  }
  document.querySelectorAll('[data-nombre-sitio]').forEach((el) => { el.textContent = contenido.sitio.nombre; });
  document.getElementById('btn-ajustes').addEventListener('click', () => {
    if (document.getElementById('panel-ajustes').hidden) abrirAjustes();
    else cerrarAjustes();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('panel-ajustes').hidden) cerrarAjustes();
  });
  iconificarSiempre(document.body);
  store.alCambiar(aplicarAjustes);
  window.addEventListener('hashchange', pintar);
  pintar();

  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

iniciar();
