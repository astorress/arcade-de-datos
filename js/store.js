// Progreso guardado SOLO en el navegador (localStorage).
// Si localStorage no está disponible (modo privado, bloqueado), todo funciona en memoria.

const CLAVE = 'arcade-datos:v1';

const VACIO = () => ({
  version: 1,
  misiones: {},   // { "1": { actividades: { id: true }, niveles: { "1": true }, completada: false, pistas: 0 } }
  cuaderno: {},   // { "1": { clave: "texto" } }
  ajustes: { tema: 'sistema', letra: 0, retro: true, sonido: false },
  mapaVisto: 0,    // última misión donde se vio al personaje en el mapa (para animar la caminata)
  personaje: null, // se llena con la pantalla «Mi personaje»; null = personaje predeterminado
  avisoVisto: false,
});

let estado = VACIO();
let disponible = true;
const oyentes = new Set();

function leer() {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return VACIO();
    const datos = JSON.parse(crudo);
    const base = VACIO();
    return { ...base, ...datos, ajustes: { ...base.ajustes, ...(datos.ajustes || {}) } };
  } catch (_) {
    disponible = false;
    return VACIO();
  }
}

function escribir() {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch (_) {
    disponible = false;
  }
  oyentes.forEach((fn) => fn(estado));
}

export function iniciar() {
  estado = leer();
  try {
    const k = '__prueba__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
  } catch (_) {
    disponible = false;
  }
}

export const almacenamientoDisponible = () => disponible;
export const obtener = () => estado;
export const alCambiar = (fn) => { oyentes.add(fn); return () => oyentes.delete(fn); };

function mision(n) {
  const k = String(n);
  if (!estado.misiones[k]) estado.misiones[k] = { actividades: {}, niveles: {}, completada: false, pistas: 0 };
  return estado.misiones[k];
}

export function actividadHecha(n, id) {
  return !!estado.misiones[String(n)]?.actividades?.[id];
}

export function marcarActividad(n, id) {
  const m = mision(n);
  if (m.actividades[id]) return false;
  m.actividades[id] = true;
  escribir();
  return true;
}

export function nivelHecho(n, nivel) {
  return !!estado.misiones[String(n)]?.niveles?.[String(nivel)];
}

export function marcarNivel(n, nivel) {
  const m = mision(n);
  if (m.niveles[String(nivel)]) return false;
  m.niveles[String(nivel)] = true;
  escribir();
  return true;
}

export function misionCompletada(n) {
  return !!estado.misiones[String(n)]?.completada;
}

export function marcarMision(n) {
  const m = mision(n);
  if (m.completada) return false;
  m.completada = true;
  escribir();
  return true;
}

export function sumarPista(n) {
  mision(n).pistas += 1;
  escribir();
}

export function texto(n, clave) {
  return estado.cuaderno[String(n)]?.[clave] ?? '';
}

export function guardarTexto(n, clave, valor) {
  const k = String(n);
  if (!estado.cuaderno[k]) estado.cuaderno[k] = {};
  estado.cuaderno[k][clave] = valor;
  escribir();
}

export function ajustes() {
  return estado.ajustes;
}

export function guardarAjuste(clave, valor) {
  estado.ajustes[clave] = valor;
  escribir();
}

export function mapaVisto() {
  return estado.mapaVisto || 0;
}

export function guardarMapaVisto(n) {
  estado.mapaVisto = n;
  escribir();
}

export function personaje() {
  return estado.personaje || {};
}

export function guardarPersonaje(cambios) {
  estado.personaje = { ...(estado.personaje || {}), ...cambios };
  escribir();
}

export function marcarAvisoVisto() {
  estado.avisoVisto = true;
  escribir();
}

/** Borra progreso, cuaderno y personaje. Conserva los ajustes de pantalla. */
export function borrarTodo() {
  const ajustesPrevios = estado.ajustes;
  estado = VACIO();
  estado.ajustes = ajustesPrevios;
  estado.avisoVisto = true;
  escribir();
}

/** Puntos: se ganan por comprender (completar), nunca se pierden. Las pistas no restan. */
export function puntos(tabla) {
  let total = 0;
  for (const m of Object.values(estado.misiones)) {
    total += Object.keys(m.actividades || {}).length * tabla.actividad;
    total += Object.keys(m.niveles || {}).length * tabla.nivel;
    if (m.completada) total += tabla.mision;
  }
  return total;
}
