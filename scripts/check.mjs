// Valida los archivos de contenido antes de publicar. Sin dependencias: `node scripts/check.mjs`.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENIDO = join(RAIZ, 'content');
const TIPOS = ['seleccion', 'leer-filas', 'emparejar', 'completar', 'tarjetas', 'seleccionar-filas', 'conteo', 'constructor', 'escritura'];
const FASES = ['hacer', 'observar', 'entender', 'aplicar'];
const COLORES = ['naranja', 'magenta', 'verde'];

const errores = [];
const avisos = [];

function leerJson(ruta) {
  try {
    return JSON.parse(readFileSync(ruta, 'utf8'));
  } catch (e) {
    errores.push(`${ruta.replace(RAIZ + '/', '')}: JSON inválido (${e.message})`);
    return null;
  }
}

function revisarActividad(a, m, donde, ids) {
  const err = (msg) => errores.push(`${donde} [${a.id || 'sin id'}]: ${msg}`);
  if (!a.id) err('falta "id"');
  else if (ids.has(a.id)) err('"id" repetido en la misión');
  else ids.add(a.id);
  if (!TIPOS.includes(a.tipo)) err(`tipo desconocido "${a.tipo}". Tipos válidos: ${TIPOS.join(', ')}`);
  if (!FASES.includes(a.fase)) err(`"fase" debe ser una de: ${FASES.join(', ')}`);
  if (!a.titulo) err('falta "titulo"');
  if (!a.consigna) err('falta "consigna"');
  const codigos = (m.datos?.filas || []).map((f) => f[0]);
  const necesitaDatos = a.usaDatos || ['leer-filas', 'seleccionar-filas', 'constructor'].includes(a.tipo);
  if (necesitaDatos && !m.datos) err('esta actividad usa la tabla, pero la misión no tiene "datos"');

  switch (a.tipo) {
    case 'seleccion':
      if (!a.opciones?.length) err('faltan "opciones"');
      else if (!a.opciones.some((o) => o.correcta)) err('ninguna opción tiene "correcta": true');
      a.opciones?.filter((o) => !o.correcta && !o.feedback).forEach((o) => avisos.push(`${donde} [${a.id}]: la opción "${o.texto}" no tiene "feedback" (se usará un mensaje genérico)`));
      break;
    case 'leer-filas':
      codigos.forEach((c) => { if (!a.lecturas?.[c]) err(`falta la lectura de la fila ${c}`); });
      break;
    case 'emparejar': {
      const tipos = new Set((a.tipos || []).map((t) => t.id));
      if (!a.pares?.length) err('faltan "pares"');
      a.pares?.forEach((p) => { if (!tipos.has(p.correcto)) err(`el par "${p.item}" apunta a un tipo inexistente "${p.correcto}"`); });
      break;
    }
    case 'completar': {
      const huecos = (a.frase?.match(/\{\d+\}/g) || []).length;
      if (huecos !== a.huecos?.length) err(`la frase tiene ${huecos} espacios y "huecos" tiene ${a.huecos?.length || 0}`);
      a.huecos?.forEach((hu, i) => { if (!hu.opciones?.some((o) => o.correcta)) err(`el espacio ${i + 1} no tiene opción correcta`); });
      break;
    }
    case 'tarjetas':
      if (!a.botones?.si || !a.botones?.no) err('faltan "botones.si" y "botones.no"');
      a.tarjetas?.forEach((t, i) => { if (!['si', 'no'].includes(t.respuesta)) err(`la tarjeta ${i + 1} debe tener "respuesta": "si" o "no"`); });
      break;
    case 'seleccionar-filas':
      a.esperadas?.forEach((c) => { if (!codigos.includes(c)) err(`la fila esperada ${c} no existe en la tabla`); });
      if (!a.feedback?.sobran || !a.feedback?.faltan) err('faltan "feedback.sobran" y "feedback.faltan"');
      break;
    case 'conteo':
      a.categorias?.forEach((c) => { if (a.esperado?.[c] === undefined) err(`falta el valor esperado para "${c}"`); });
      a.resaltar?.forEach((c) => { if (!codigos.includes(c)) err(`la fila a resaltar ${c} no existe`); });
      break;
    case 'constructor':
      if (!a.pasos?.length) err('faltan "pasos"');
      break;
    case 'escritura':
      if (!a.frases?.length) err('faltan "frases"');
      break;
  }
}

const indice = leerJson(join(CONTENIDO, 'misiones', 'indice.json'));
const sitio = leerJson(join(CONTENIDO, 'sitio.json'));
const glosario = leerJson(join(CONTENIDO, 'glosario.json'));
if (sitio && !sitio.nombre) errores.push('sitio.json: falta "nombre"');
if (glosario && !Array.isArray(glosario.terminos)) errores.push('glosario.json: falta la lista "terminos"');

// ---------- Panel de control ----------
const SI = new Set([true, 'si', 'sí', 'on', 'true', 1, '1', 'abierta']);
const NO = new Set([false, 'no', 'off', 'false', 0, '0', 'cerrada']);
const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v);
let panel = {};
const rutaPanel = join(CONTENIDO, 'panel-de-control.js');
if (existsSync(rutaPanel)) {
  try { panel = (await import(pathToFileURL(rutaPanel).href)).default || {}; }
  catch (e) { errores.push(`panel-de-control.js no se pudo leer: ${e.message}`); }
} else avisos.push('No existe content/panel-de-control.js; se usa el "estado" de cada misión.');
const resumenPanel = [];

const numeros = new Set();
for (const archivo of indice?.misiones || []) {
  const ruta = join(CONTENIDO, 'misiones', archivo);
  if (!existsSync(ruta)) { errores.push(`indice.json menciona ${archivo}, pero no existe`); continue; }
  const m = leerJson(ruta);
  if (!m) continue;
  const donde = archivo;
  const p = panel[m.numero];
  if (p) {
    if (p.abierta !== undefined) {
      if (!SI.has(norm(p.abierta)) && !NO.has(norm(p.abierta))) errores.push(`panel-de-control.js, misión ${m.numero}: "abierta" debe ser true/false (o si/no, on/off); dice "${p.abierta}"`);
      m.estado = SI.has(norm(p.abierta)) ? 'disponible' : 'proximamente';
    }
    if (p.caso) {
      if (!m.casos) errores.push(`panel-de-control.js, misión ${m.numero}: tiene "caso: '${p.caso}'", pero la misión tiene un solo caso`);
      else m.casoActivo = p.caso;
    }
  }
  if (typeof m.numero !== 'number') errores.push(`${donde}: "numero" debe ser un número`);
  if (numeros.has(m.numero)) errores.push(`${donde}: número de misión repetido (${m.numero})`);
  numeros.add(m.numero);
  if (!['disponible', 'proximamente'].includes(m.estado)) errores.push(`${donde}: "estado" debe ser "disponible" o "proximamente"`);
  if (m.color && !COLORES.includes(m.color)) errores.push(`${donde}: "color" debe ser uno de ${COLORES.join(', ')}`);
  ['titulo', 'sesion', 'caso', 'habilidad'].forEach((k) => { if (!m[k]) errores.push(`${donde}: falta "${k}"`); });
  if (!m.insignia?.nombre) errores.push(`${donde}: falta "insignia.nombre"`);

  if (m.teoria) {
    const t = m.teoria;
    if (!t.intro) errores.push(`${donde}: "teoria.intro" vacío`);
    const idsTema = new Set();
    (t.temas || []).forEach((tema, i) => {
      if (!tema.id) errores.push(`${donde}: el tema ${i + 1} de "teoria" no tiene "id"`);
      else if (idsTema.has(tema.id)) errores.push(`${donde}: id de tema repetido "${tema.id}"`);
      idsTema.add(tema.id);
      ['titulo', 'idea', 'explicacion'].forEach((k) => { if (!tema[k]) errores.push(`${donde}: el tema "${tema.id || i + 1}" no tiene "${k}"`); });
    });
    (t.platzi || []).forEach((pl) => {
      if (!['aplica', 'anticipa', 'retoma'].includes(pl.relacion)) errores.push(`${donde}: "teoria.platzi" de ${pl.modulo}: "relacion" debe ser aplica, anticipa o retoma`);
      if (!pl.curso || !pl.modulo || !pl.contenidos?.length) errores.push(`${donde}: cada entrada de "teoria.platzi" necesita "curso", "modulo" y "contenidos"`);
    });
  } else {
    avisos.push(`${donde}: todavía no tiene "teoria"`);
  }

  // Una misión puede traer un solo caso (campos en la raíz) o varios en "casos" con "casoActivo".
  const idsTema = new Set((m.teoria?.temas || []).map((t) => t.id));
  let casos = [[donde, m]];
  if (m.casos) {
    if (!m.casos[m.casoActivo] && m.casoActivo !== 'ambos') errores.push(`${donde}: el caso "${m.casoActivo}" no existe. Opciones: ${[...Object.keys(m.casos), 'ambos'].map((k) => `'${k}'`).join(', ')}`);
    casos = Object.entries(m.casos).map(([k, c]) => [`${donde} (caso ${k})`, { ...m, ...c }]);
    Object.entries(m.casos).forEach(([k, c]) => { if (!c.nombre) errores.push(`${donde}: el caso "${k}" necesita "nombre" (se muestra en la vista previa)`); });
  }
  resumenPanel.push(`  Misión ${m.numero}  ${m.estado === 'disponible' ? '🟢 abierta  ' : '🔒 bloqueada'}  ${m.casos ? `caso: ${m.casoActivo === 'ambos' ? `ambos (${Object.keys(m.casos).join(' + ')})` : m.casoActivo}` : '(un solo caso)'}${m.casos || m.niveles?.length ? '' : '  · sin niveles todavía'}`);
  for (const [dondeCaso, c] of casos) {
    const tieneNiveles = c.niveles?.length > 0;
    if (m.estado === 'disponible' && !tieneNiveles) errores.push(`${dondeCaso}: está "disponible" pero no tiene niveles`);
    if (!tieneNiveles) continue; // misiones en "proximamente" sin niveles: solo teoría
    if (!c.historia) errores.push(`${dondeCaso}: falta "historia"`);
    if (!c.titulo || !c.caso) errores.push(`${dondeCaso}: faltan "titulo" o "caso"`);
    if (c.datos) {
      const n = c.datos.columnas?.length;
      c.datos.filas?.forEach((f, i) => { if (f.length !== n) errores.push(`${dondeCaso}: la fila ${i + 1} de "datos" tiene ${f.length} valores y hay ${n} columnas`); });
      if (!c.datos.definiciones?.length) errores.push(`${dondeCaso}: "datos.definiciones" es obligatorio (se muestra siempre junto a la tabla)`);
      if (!c.datos.aviso) avisos.push(`${dondeCaso}: "datos.aviso" vacío; se usará «Datos ficticios, solo para practicar.»`);
    }
    if (!c.conceptos?.length) errores.push(`${dondeCaso}: faltan "conceptos"`);
    if (c.enClase) revisarApoyo(c.enClase, `${dondeCaso} [enClase]`);
    const ids = new Set();
    c.niveles.forEach((nv) => {
      if (!nv.actividades?.length) errores.push(`${dondeCaso} nivel ${nv.numero}: no tiene actividades`);
      if (!nv.cierre) avisos.push(`${dondeCaso} nivel ${nv.numero}: sin "cierre"`);
      nv.actividades?.forEach((a) => {
        revisarActividad(a, c, `${dondeCaso} nivel ${nv.numero}`, ids);
        if (a.tema && !idsTema.has(a.tema)) errores.push(`${dondeCaso} [${a.id}]: "tema": "${a.tema}" no existe en "teoria.temas"`);
        revisarApoyo(a.apoyo, `${dondeCaso} [${a.id}]`);
      });
    });
  }
}

function revisarApoyo(ap, donde) {
  if (!ap) return;
  if (Array.isArray(ap)) { ap.forEach((x) => revisarApoyo(x, donde)); return; }
  if (!['comparacion', 'tabla', 'texto', 'grafico'].includes(ap.tipo)) errores.push(`${donde}: "apoyo.tipo" desconocido "${ap.tipo}"`);
  if (ap.tipo === 'tabla') ap.filas?.forEach((f, i) => { if (f.length !== ap.columnas?.length) errores.push(`${donde}: la fila ${i + 1} de la tabla de apoyo no cuadra con sus columnas`); });
  if (ap.tipo === 'grafico') revisarGrafico(ap, donde);
  if (ap.tipo === 'comparacion') ap.items?.forEach((it) => it.grafico && revisarGrafico(it.grafico, donde));
}

function revisarGrafico(g, donde) {
  if (!['barras', 'lineas', undefined].includes(g.forma)) errores.push(`${donde}: "forma" del gráfico debe ser barras o lineas`);
  if (!g.etiquetas?.length || !g.series?.length) errores.push(`${donde}: el gráfico necesita "etiquetas" y "series"`);
  g.series?.forEach((x) => { if (x.valores?.length !== g.etiquetas?.length) errores.push(`${donde}: la serie "${x.nombre || ''}" tiene ${x.valores?.length} valores y hay ${g.etiquetas?.length} etiquetas`); });
}

console.log('Panel de control (content/panel-de-control.js):');
resumenPanel.sort().forEach((l) => console.log(l));
avisos.forEach((a) => console.warn(`⚠  ${a}`));
if (errores.length) {
  errores.forEach((e) => console.error(`✗ ${e}`));
  console.error(`\n${errores.length} error(es) en el contenido.`);
  process.exit(1);
}
console.log(`✓ Contenido válido: ${numeros.size} misiones, ${glosario?.terminos?.length || 0} términos de glosario.`);
