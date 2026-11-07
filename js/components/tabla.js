import { h, md } from '../util.js';

/**
 * Tabla de datos de la misión, con sus definiciones y el aviso de datos ficticios siempre visibles.
 * opciones:
 *   modo: 'ver' | 'leer' (tocar una fila a la vez) | 'marcar' (selección múltiple)
 *   resaltar: códigos a resaltar
 *   marcadas: códigos marcados al inicio (modo marcar)
 *   alTocar(codigo, marcada): callback
 *   compacta: oculta definiciones (solo si ya están visibles en otro lugar)
 */
export function tablaDatos(datos, opciones = {}) {
  const { modo = 'ver', resaltar = [], marcadas = [], alTocar, compacta = false } = opciones;
  const seleccion = new Set(marcadas);
  let activa = null;
  const filasEl = new Map();

  const tocar = (codigo) => {
    if (modo === 'leer') {
      activa = codigo;
      filasEl.forEach((tr, c) => {
        const on = c === activa;
        tr.classList.toggle('fila--activa', on);
        tr.querySelector('button').setAttribute('aria-pressed', String(on));
      });
      alTocar?.(codigo, true);
    } else if (modo === 'marcar') {
      const on = !seleccion.has(codigo);
      on ? seleccion.add(codigo) : seleccion.delete(codigo);
      const tr = filasEl.get(codigo);
      tr.classList.toggle('fila--marcada', on);
      tr.querySelector('button').setAttribute('aria-pressed', String(on));
      tr.querySelector('.marca').textContent = on ? '✓' : '';
      alTocar?.(codigo, on);
    }
  };

  const interactiva = modo === 'leer' || modo === 'marcar';
  const cabecera = h('tr', {},
    datos.columnas.map((c, i) => h('th', { scope: 'col', class: i === 0 ? 'col-fija' : null }, c))
  );

  const cuerpo = h('tbody', {},
    datos.filas.map((fila) => {
      const codigo = fila[0];
      const etiqueta = modo === 'leer' ? `Leer fila ${codigo}` : `Marcar fila ${codigo}`;
      const celdaCodigo = interactiva
        ? h('th', { scope: 'row', class: 'col-fija' },
            h('button', {
              type: 'button', class: 'fila-btn', 'aria-pressed': String(seleccion.has(codigo)),
              'aria-label': `${etiqueta}: ${fila.join(', ')}`,
              onclick: (e) => { e.stopPropagation(); tocar(codigo); },
            },
            h('span', { class: 'marca', 'aria-hidden': 'true' }, seleccion.has(codigo) ? '✓' : ''),
            codigo))
        : h('th', { scope: 'row', class: 'col-fija' }, codigo);
      const tr = h('tr', {
        class: [
          resaltar.includes(codigo) ? 'fila--resaltada' : '',
          seleccion.has(codigo) ? 'fila--marcada' : '',
          interactiva ? 'fila--tocable' : '',
        ].join(' ').trim() || null,
        onclick: interactiva ? () => tocar(codigo) : null,
      },
      celdaCodigo,
      fila.slice(1).map((v) => h('td', {}, v === 'Sí' ? h('span', { class: 'si' }, 'Sí') : v === 'No' ? h('span', { class: 'no' }, 'No') : v)));
      filasEl.set(codigo, tr);
      return tr;
    })
  );

  const tabla = h('div', { class: 'tabla-scroll', tabindex: '0', role: 'region', 'aria-label': `Tabla: ${datos.titulo}` },
    h('table', { class: 'tabla' },
      h('caption', {}, datos.titulo, ' ', h('span', { class: 'etiqueta-ficticio' }, 'ficticio')),
      h('thead', {}, cabecera),
      cuerpo
    )
  );

  const caja = h('div', { class: 'datos' },
    interactiva ? h('p', { class: 'datos__ayuda' }, modo === 'leer' ? '👆 Toca una fila para leerla.' : '👆 Toca las filas para marcarlas o desmarcarlas.') : null,
    h('p', { class: 'datos__deslizar', 'aria-hidden': 'true' }, '↔ Desliza la tabla para ver todas las columnas'),
    tabla,
    resaltar.length ? h('p', { class: 'datos__leyenda' }, h('span', { class: 'muestra-resaltado', 'aria-hidden': 'true' }), ` Filas resaltadas: ${resaltar.join(', ')}`) : null,
    compacta ? null : h('div', { class: 'definiciones' },
      h('p', { class: 'definiciones__titulo' }, 'Así se lee esta tabla'),
      h('ul', {}, datos.definiciones.map((d) => h('li', { html: md(d) }))),
      h('p', { class: 'aviso-ficticio' }, '⚠ ', datos.aviso || 'Datos ficticios, solo para practicar.')
    )
  );

  caja.seleccion = () => [...seleccion].sort();
  return caja;
}
