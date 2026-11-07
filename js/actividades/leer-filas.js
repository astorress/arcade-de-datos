import { h } from '../util.js';

// Tocar filas: la página lee cada fila en lenguaje cotidiano.
export function leerFilas(act, ctx) {
  const leidas = new Set();
  const minimo = act.minimo ?? 2;
  const lectura = h('div', { class: 'lectura', 'aria-live': 'polite' },
    h('p', { class: 'lectura__vacia' }, 'Aquí aparecerá lo que cuenta la fila que toques.'));
  const contador = h('p', { class: 'contador' });

  const actualizar = () => {
    contador.textContent = `Filas leídas: ${leidas.size} de ${minimo} mínimo${leidas.size >= minimo ? ' ✓' : ''}`;
  };

  const tabla = ctx.tabla({
    modo: 'leer',
    alTocar: (codigo) => {
      leidas.add(codigo);
      lectura.replaceChildren(
        h('p', { class: 'lectura__codigo' }, `Fila ${codigo}`),
        h('p', { class: 'lectura__texto' }, act.lecturas?.[codigo] || ''));
      actualizar();
      if (leidas.size >= minimo) ctx.bien(leidas.size === minimo ? 'Ya leíste suficientes filas. Puedes seguir tocando otras si quieres.' : undefined);
    },
  });

  actualizar();
  return h('div', {}, tabla, lectura, contador);
}
