// Carga del contenido (archivos JSON en /content). Nada de esto está en el código.
//
// Panel de control: content/panel-de-control.js decide qué misiones están abiertas y qué caso se usa.
// Si una misión no aparece en el panel, se usa lo que diga su JSON ("estado" y "casoActivo").
//
// Casos: una misión puede traer varios casos en "casos" ({ clave: { titulo, caso, historia, datos,
// niveles, conceptos, ... } }) y elegir uno con "casoActivo". Los estudiantes solo ven el activo.
//
// Vista previa del tutor: abrir el sitio con ?previa (por ejemplo .../arcade-de-datos/?previa#/)
// muestra todas las misiones aunque estén en "proximamente" y permite cambiar de caso para revisarlas.
// Se apaga con ?previa=0. Solo afecta a ese navegador y a esa pestaña.

const BASE = new URL('../content/', import.meta.url);
const CLAVE_PREVIA = 'arcade-datos:previa';
const CLAVE_CASOS = 'arcade-datos:previa-casos';

let cache = null;

function sesion() {
  try { return window.sessionStorage; } catch { return null; }
}

(function leerParametro() {
  const p = new URLSearchParams(location.search);
  if (!p.has('previa')) return;
  const ss = sesion();
  if (!ss) return;
  if (p.get('previa') === '0') { ss.removeItem(CLAVE_PREVIA); ss.removeItem(CLAVE_CASOS); } else ss.setItem(CLAVE_PREVIA, '1');
})();

export function enPrevia() {
  return sesion()?.getItem(CLAVE_PREVIA) === '1';
}

function casosPrevia() {
  try { return JSON.parse(sesion()?.getItem(CLAVE_CASOS) || '{}'); } catch { return {}; }
}

/** Solo en vista previa: cambia el caso que se muestra de una misión y recarga. */
export function verCasoEnPrevia(numero, clave) {
  const c = casosPrevia();
  c[numero] = clave;
  sesion()?.setItem(CLAVE_CASOS, JSON.stringify(c));
  cache = null;
  location.reload();
}

const SI = new Set([true, 'si', 'sí', 'on', 'true', 1, '1', 'abierta']);
export const valorAbierta = (v) => SI.has(typeof v === 'string' ? v.trim().toLowerCase() : v);

async function leerPanel() {
  try {
    return (await import(`${new URL('panel-de-control.js', BASE).href}?v=${Date.now()}`)).default || {};
  } catch (e) {
    console.warn('No se pudo leer el panel de control; se usa el estado de cada misión.', e);
    return {};
  }
}

/** Aplica el panel de control sobre el JSON de la misión. */
function conPanel(m, panel) {
  const p = m && panel[m.numero];
  if (!p) return m;
  return {
    ...m,
    ...(p.abierta !== undefined ? { estado: valorAbierta(p.abierta) ? 'disponible' : 'proximamente' } : {}),
    ...(p.caso ? { casoActivo: p.caso } : {}),
  };
}

async function json(ruta) {
  const r = await fetch(new URL(ruta, BASE), { cache: 'no-cache' });
  if (!r.ok) throw new Error(`No se pudo cargar ${ruta} (${r.status})`);
  return r.json();
}

/** Aplana la misión con su caso activo. Los id de actividad llevan el caso delante para no mezclar progreso. */
function conCaso(m) {
  if (!m || !m.casos) return m;
  const claves = Object.keys(m.casos);
  const elegido = enPrevia() ? casosPrevia()[m.numero] : null;
  const clave = (elegido && m.casos[elegido]) ? elegido : (m.casos[m.casoActivo] ? m.casoActivo : claves[0]);
  const caso = m.casos[clave];
  const niveles = (caso.niveles || []).map((n) => ({
    ...n,
    actividades: n.actividades.map((a) => ({ ...a, id: `${clave}:${a.id}` })),
  }));
  return {
    ...m,
    ...caso,
    insignia: { ...m.insignia, ...(caso.insignia || {}) },
    niveles,
    casoClave: clave,
    casosDisponibles: claves.map((k) => ({ clave: k, nombre: m.casos[k].nombre || k })),
  };
}

export async function cargarTodo() {
  if (cache) return cache;
  const [sitio, glosario, indice, panel] = await Promise.all([
    json('sitio.json'),
    json('glosario.json'),
    json('misiones/indice.json'),
    leerPanel(),
  ]);
  const misiones = await Promise.all(
    indice.misiones.map((archivo) =>
      json(`misiones/${archivo}`).catch((e) => {
        console.error(e);
        return null;
      })
    )
  );
  cache = {
    sitio,
    glosario: glosario.terminos || [],
    misiones: misiones.filter(Boolean).map((m) => conCaso(conPanel(m, panel))).sort((a, b) => a.numero - b.numero),
  };
  return cache;
}

export function disponible(m) {
  const tieneNiveles = m && Array.isArray(m.niveles) && m.niveles.length > 0;
  return tieneNiveles && (m.estado === 'disponible' || enPrevia());
}

export function buscarMision(contenido, n) {
  return contenido.misiones.find((m) => m.numero === Number(n));
}

/** Clave del cuaderno: en misiones con varios casos, lo escrito queda separado por caso. */
export function claveTexto(m, k) {
  return m?.casoClave ? `${m.casoClave}:${k}` : k;
}
