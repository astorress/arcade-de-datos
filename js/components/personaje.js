// Personaje personalizable en pixel art (capas sobre una cuadrícula de 16 x 15).
// Todo es local: se guarda en el navegador junto con el progreso.

export const OPCIONES = {
  estilo: [
    { id: 'gorra', nombre: 'Gorra' },
    { id: 'corto', nombre: 'Pelo corto' },
    { id: 'largo', nombre: 'Pelo largo' },
    { id: 'casco', nombre: 'Casco arcade' },
  ],
  pelo: [
    { id: 'negro', nombre: 'Negro', color: '#2B2238' },
    { id: 'castano', nombre: 'Castaño', color: '#6B3E1F' },
    { id: 'rubio', nombre: 'Rubio', color: '#E8C25A' },
    { id: 'rojo', nombre: 'Rojo', color: '#C0392B' },
    { id: 'magenta', nombre: 'Magenta', color: '#CB318E' },
    { id: 'azul', nombre: 'Azul', color: '#2F6FD0' },
    { id: 'verde', nombre: 'Verde', color: '#7FC200' },
    { id: 'gris', nombre: 'Gris', color: '#B8B3C8' },
  ],
  piel: [
    { id: 'durazno', nombre: 'Durazno', color: '#FFD9B8' },
    { id: 'miel', nombre: 'Miel', color: '#F2C29B' },
    { id: 'canela', nombre: 'Canela', color: '#D9A06E' },
    { id: 'caramelo', nombre: 'Caramelo', color: '#B97A4B' },
    { id: 'cacao', nombre: 'Cacao', color: '#8A5632' },
    { id: 'cafe', nombre: 'Café', color: '#5E3A22' },
  ],
  camiseta: [
    { id: 'naranja', nombre: 'Naranja', color: '#FF7C1A' },
    { id: 'magenta', nombre: 'Magenta', color: '#CB318E' },
    { id: 'verde', nombre: 'Verde', color: '#7FC200' },
    { id: 'azul', nombre: 'Azul', color: '#2F6FD0' },
    { id: 'amarillo', nombre: 'Amarillo', color: '#F5C431' },
    { id: 'morado', nombre: 'Morado', color: '#7A4FD1' },
    { id: 'crema', nombre: 'Crema', color: '#F3ECDD' },
    { id: 'gris', nombre: 'Gris', color: '#8A8F9E' },
  ],
  pantalon: [
    { id: 'jean', nombre: 'Jean', color: '#3B5BA5' },
    { id: 'negro', nombre: 'Oscuro', color: '#2B2238' },
    { id: 'cafe', nombre: 'Café', color: '#7A5233' },
    { id: 'oliva', nombre: 'Oliva', color: '#5E6B2E' },
    { id: 'gris', nombre: 'Gris', color: '#6B6F7E' },
    { id: 'morado', nombre: 'Morado', color: '#4E3A7A' },
  ],
};

// Accesorios: el lápiz es libre; los demás se ganan con la insignia de cada misión.
export const ACCESORIOS = [
  { id: 'ninguno', nombre: 'Sin accesorio', mision: null },
  { id: 'lapiz', nombre: 'Lápiz', mision: null },
  { id: 'lupa', nombre: 'Lupa', mision: 1 },
  { id: 'escoba', nombre: 'Escoba', mision: 2 },
  { id: 'regla', nombre: 'Regla', mision: 3 },
  { id: 'balanza', nombre: 'Balanza', mision: 4 },
  { id: 'embudo', nombre: 'Embudo', mision: 5 },
  { id: 'grafico', nombre: 'Gráfico', mision: 6 },
  { id: 'tablero', nombre: 'Tablero', mision: 7 },
  { id: 'estrella', nombre: 'Varita estrella', mision: 8 },
];

export const PREDETERMINADO = {
  nombre: '', estilo: 'gorra', pelo: 'magenta', piel: 'miel', camiseta: 'naranja', pantalon: 'jean', accesorio: 'ninguno',
};

const TINTA = '#1E1B33';

// Cuerpo base (12 de ancho; se dibuja corrido 2 columnas para dejar espacio al accesorio).
// o = contorno · S = piel · e = ojos · m = boca · T = camiseta · P = pantalón · z = zapatos
const BASE = [
  '....oooo....',
  '...oSSSSo...',
  '..oSSSSSSo..',
  '..oSeSSeSo..',
  '..oSSSSSSo..',
  '...oSmmSo...',
  '....oSSo....',
  '..oTTTTTTo..',
  '.oTTTTTTTTo.',
  '.oToTTTToTo.',
  '.oSoTTTToSo.',
  '..ooPPPPoo..',
  '...oPPPPo...',
  '...oPooPo...',
  '..ozzoozzo..',
];

// H = pelo/gorra · h = tono oscuro · w = brillo
const CABEZAS = {
  gorra: ['...oHHHHo...', '..oHHHHHHo..', '..ohhhhhhhho'],
  corto: ['...oHHHHo...', '..oHHHHHHo..', '..oH....Ho..', '..oH........'],
  largo: ['...oHHHHo...', '..oHHHHHHo..', '.oHH....HHo.', '.oH......Ho.', '.oH......Ho.', '.oH......Ho.', '..H......H..'],
  casco: ['...oHHHHo...', '..oHHwwHHo..', '..oHHHHHHo..', '..oh....ho..'],
};

// Accesorios como lista de píxeles [x, y, color] en la cuadrícula completa de 16 columnas.
const C = { madera: '#8A5A2B', metal: '#5B6170', oro: '#E8B931', vidrio: '#9FD8F5', verde: '#7FC200', magenta: '#CB318E', naranja: '#FF7C1A', crema: '#F3ECDD', rosa: '#F582C4' };
const linea = (x, y0, y1, color) => Array.from({ length: y1 - y0 + 1 }, (_, i) => [x, y0 + i, color]);
const DIBUJOS = {
  lapiz: [...linea(13, 4, 9, C.oro), [13, 3, C.rosa], [13, 10, C.crema], [13, 11, TINTA]],
  lupa: [[13, 4, C.metal], [14, 4, C.metal], [12, 5, C.metal], [15, 5, C.metal], [12, 6, C.metal], [15, 6, C.metal], [13, 7, C.metal], [14, 7, C.metal],
    [13, 5, C.vidrio], [14, 5, C.vidrio], [13, 6, C.vidrio], [14, 6, C.crema], [12, 8, C.madera], [12, 9, C.madera]],
  escoba: [...linea(13, 2, 10, C.madera), [12, 11, C.oro], [13, 11, C.oro], [14, 11, C.oro], [11, 12, C.oro], [12, 12, C.oro], [13, 12, C.oro], [14, 12, C.oro], [15, 12, C.oro]],
  regla: [...linea(13, 3, 11, C.oro), ...linea(14, 3, 11, C.oro), [13, 4, TINTA], [13, 6, TINTA], [13, 8, TINTA], [13, 10, TINTA]],
  balanza: [...linea(13, 4, 10, C.metal), [11, 4, C.metal], [12, 4, C.metal], [14, 4, C.metal], [15, 4, C.metal], [11, 5, C.oro], [15, 5, C.oro], [10, 6, C.oro], [11, 6, C.oro], [12, 6, C.oro], [14, 6, C.oro], [15, 6, C.oro]],
  embudo: [[11, 4, C.verde], [12, 4, C.verde], [13, 4, C.verde], [14, 4, C.verde], [15, 4, C.verde], [12, 5, C.verde], [13, 5, C.verde], [14, 5, C.verde], [13, 6, C.verde], [13, 7, C.verde], [13, 8, C.metal], [13, 9, C.metal]],
  grafico: [[11, 9, C.crema], [12, 9, C.crema], [13, 9, C.crema], [14, 9, C.crema], [15, 9, C.crema], [11, 8, C.verde], [12, 7, C.naranja], [12, 8, C.naranja], [13, 6, C.magenta], [13, 7, C.magenta], [13, 8, C.magenta], [14, 4, C.verde], [14, 5, C.verde], [14, 6, C.verde], [14, 7, C.verde], [14, 8, C.verde]],
  tablero: [...[3, 4, 5, 6, 7].flatMap((y) => [11, 12, 13, 14, 15].map((x) => [x, y, TINTA])), [12, 5, C.naranja], [13, 5, C.naranja], [12, 6, C.verde], [14, 6, C.magenta], [14, 5, C.magenta], [13, 8, C.metal], [13, 9, C.metal]],
  estrella: [...linea(13, 7, 11, C.madera), [13, 3, C.oro], [12, 4, C.oro], [13, 4, C.oro], [14, 4, C.oro], [11, 5, C.oro], [12, 5, C.oro], [13, 5, C.oro], [14, 5, C.oro], [15, 5, C.oro], [12, 6, C.oro], [14, 6, C.oro]],
};

function oscurecer(hex, f = 0.7) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const color = (grupo, id) => (OPCIONES[grupo].find((o) => o.id === id) || OPCIONES[grupo][0]).color;

/** Devuelve el SVG del personaje como texto. `desbloqueado(id)` decide si se dibuja el accesorio. */
export function spriteSVG(p = PREDETERMINADO, { tam = 48, desbloqueado = () => true, clase = '' } = {}) {
  const x = { ...PREDETERMINADO, ...p };
  const pelo = color('pelo', x.pelo);
  const pal = {
    o: TINTA, e: TINTA, m: '#9C3B3B', S: color('piel', x.piel), T: color('camiseta', x.camiseta),
    P: color('pantalon', x.pantalon), z: TINTA, H: pelo, h: oscurecer(pelo), w: '#F3EEE3',
  };
  const px = new Map();
  const poner = (cx, cy, c) => px.set(`${cx},${cy}`, c);
  BASE.forEach((fila, y) => [...fila].forEach((ch, i) => { if (ch !== '.') poner(i + 2, y, pal[ch]); }));
  (CABEZAS[x.estilo] || CABEZAS.gorra).forEach((fila, y) => [...fila].forEach((ch, i) => { if (ch !== '.') poner(i + 2, y, pal[ch]); }));
  if (x.accesorio !== 'ninguno' && DIBUJOS[x.accesorio] && desbloqueado(x.accesorio)) {
    DIBUJOS[x.accesorio].forEach(([cx, cy, c]) => poner(cx, cy, c));
  }
  let rects = '';
  px.forEach((c, k) => {
    const [cx, cy] = k.split(',');
    rects += `<rect x="${cx}" y="${cy}" width="1.02" height="1.02" fill="${c}"/>`;
  });
  return `<svg viewBox="0 0 16 15" width="${tam}" height="${Math.round((tam * 15) / 16)}" shape-rendering="crispEdges" class="sprite ${clase}" aria-hidden="true" focusable="false">${rects}</svg>`;
}

export function aleatorio(accesoriosDisponibles) {
  const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)].id;
  return {
    estilo: elegir(OPCIONES.estilo), pelo: elegir(OPCIONES.pelo), piel: elegir(OPCIONES.piel),
    camiseta: elegir(OPCIONES.camiseta), pantalon: elegir(OPCIONES.pantalon),
    accesorio: elegir(accesoriosDisponibles),
  };
}
