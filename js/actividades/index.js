// Registro de tipos de actividad. Para un tipo nuevo: crea su archivo y agrégalo aquí.
import { seleccion } from './seleccion.js';
import { leerFilas } from './leer-filas.js';
import { emparejar } from './emparejar.js';
import { completar } from './completar.js';
import { tarjetas } from './tarjetas.js';
import { seleccionarFilas } from './seleccionar-filas.js';
import { conteo } from './conteo.js';
import { constructor } from './constructor.js';
import { escritura } from './escritura.js';

export const TIPOS = {
  'seleccion': seleccion,
  'leer-filas': leerFilas,
  'emparejar': emparejar,
  'completar': completar,
  'tarjetas': tarjetas,
  'seleccionar-filas': seleccionarFilas,
  'conteo': conteo,
  'constructor': constructor,
  'escritura': escritura,
};
