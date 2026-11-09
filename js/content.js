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

/**
 * Aplana la misión con su caso activo. Con caso "ambos", la misión trae los niveles de todos los casos
 * (numerados seguidos: 1-3 el primero, 4-6 el segundo) y la insignia se gana al terminar cualquiera de ellos.
 * Los id de actividad y las claves del cuaderno llevan el caso delante para no mezclar progreso, salvo que
 * el caso tenga "idsSinPrefijo": true (para conservar el progreso de una misión que antes tenía un solo caso).
 */
export const AMBOS = 'ambos';

function aplanarCaso(m, clave, desde = 0) {
  const caso = m.casos[clave];
  const prefijo = caso.idsSinPrefijo ? '' : `${clave}:`;
  const niveles = (caso.niveles || []).map((n) => ({
    ...n,
    numero: desde + n.numero,
    numeroEnCaso: n.numero,
    casoClave: clave,
    casoNombre: caso.nombre || clave,
    prefijo,
    datos: caso.datos,
    actividades: n.actividades.map((a) => ({ ...a, id: `${prefijo}${a.id}`, datosCaso: caso.datos })),
  }));
  return {
    ...m,
    ...caso,
    insignia: { ...m.insignia, ...(caso.insignia || {}) },
    niveles,
    casoClave: clave,
  };
}

function conCaso(m) {
  if (!m) return m;
  if (!m.casos) {
    const niveles = (m.niveles || []).map((n) => ({ ...n, prefijo: '', datos: m.datos }));
    return { ...m, niveles, grupos: [{ clave: 'unico', nombre: m.caso, mision: { ...m, niveles } }] };
  }
  const claves = Object.keys(m.casos);
  const elegido = enPrevia() ? casosPrevia()[m.numero] : null;
  const pedido = elegido || m.casoActivo;
  const casosDisponibles = claves.map((k) => ({ clave: k, nombre: m.casos[k].nombre || k }));

  if (pedido === AMBOS && claves.length > 1) {
    let desde = 0;
    const grupos = claves.map((k) => {
      const sub = aplanarCaso(m, k, desde);
      desde += sub.niveles.length;
      return { clave: k, nombre: m.casos[k].nombre || k, mision: sub };
    });
    const primero = grupos[0].mision;
    const vistos = new Set();
    const conceptos = grupos.flatMap((g) => g.mision.conceptos || []).filter((k) => !vistos.has(k.termino) && vistos.add(k.termino));
    return {
      ...primero,
      titulo: m.titulo,
      caso: grupos.map((g) => g.mision.caso).join(' · '),
      historia: m.historiaAmbos || `Esta misión trae ${grupos.length} casos. Con terminar uno ganas la insignia; el otro es práctica extra para afianzar lo aprendido. ¡Tú eliges por dónde empezar!`,
      niveles: grupos.flatMap((g) => g.mision.niveles),
      conceptos,
      grupos,
      casoClave: AMBOS,
      casosDisponibles,
    };
  }
  const clave = m.casos[pedido] ? pedido : claves[0];
  const sub = aplanarCaso(m, clave);
  return { ...sub, grupos: [{ clave, nombre: m.casos[clave].nombre || clave, mision: sub }], casosDisponibles };
}

/** ¿La misión está terminada? Basta con terminar todos los niveles de uno de sus casos. */
export function misionTerminada(m, nivelHecho) {
  return (m.grupos || [{ mision: m }]).some((g) => g.mision.niveles.length && g.mision.niveles.every((n) => nivelHecho(m.numero, n.numero)));
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

/** Clave del cuaderno: en misiones con varios casos, lo escrito queda separado por caso (prefijo del nivel). */
export function claveTexto(nivel, k) {
  return `${nivel?.prefijo || ''}${k}`;
}
