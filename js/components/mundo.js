import { h, pad2, rotulo, reducirMovimiento } from '../util.js';

// Mapa de mundo estilo videojuego: terreno en SVG (decorativo) y checkpoints como enlaces HTML encima.
// Coordenadas en un lienzo de 360 x 1000; se escala al ancho disponible.
const ANCHO = 360;
const K = 1.45; // estiramiento vertical: más espacio entre checkpoints en el celular
const ALTO = Math.round(1000 * K);
const Y = (v) => Math.round(v * K);
const PUNTOS = [
  [62, 120], [296, 225], [66, 330], [294, 440], [62, 548], [296, 655], [66, 765], [286, 880],
].map(([x, y]) => [x, Y(y)]);

function camino(p) {
  let d = `M ${p[0][0]} ${p[0][1] - 70} L ${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const my = (y0 + y1) / 2;
    d += ` C ${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
  }
  return d;
}

const arbol = (x, y, s = 1, clase = '') => `
  <g transform="translate(${x} ${y}) scale(${s})" class="m-arbol ${clase}">
    <rect x="-3" y="6" width="6" height="10" class="m-tronco"/>
    <polygon points="0,-18 14,6 -14,6" class="m-copa"/>
    <polygon points="0,-28 10,-8 -10,-8" class="m-copa m-copa--alta"/>
  </g>`;

const casa = (x, y, clase = '') => `
  <g transform="translate(${x} ${y})" class="m-casa ${clase}">
    <rect x="-11" y="-4" width="22" height="16" class="m-muro"/>
    <polygon points="-14,-4 0,-16 14,-4" class="m-techo"/>
    <rect x="-3" y="4" width="6" height="8" class="m-puerta"/>
    <rect x="-9" y="0" width="4" height="4" class="m-ventana"/><rect x="5" y="0" width="4" height="4" class="m-ventana"/>
  </g>`;

const nube = (x, y) => `
  <g transform="translate(${x} ${y})" class="m-nube">
    <rect x="-18" y="-4" width="36" height="10"/><rect x="-10" y="-11" width="18" height="8"/>
  </g>`;


// ---------- Detalles de Medellín (genéricos, sin logos) ----------

// Casitas de ladrillo en las laderas: siguen el perfil de la montaña. De noche se prenden las ventanas.
const MONTANA = [[0, 66], [40, 24], [80, 60], [120, 14], [170, 58], [210, 28], [260, 62], [300, 22], [360, 66]];
function alturaMontana(x) {
  for (let i = 1; i < MONTANA.length; i++) {
    const [x0, y0] = MONTANA[i - 1]; const [x1, y1] = MONTANA[i];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 66;
}
function laderas() {
  let r = '';
  for (let x = 4, i = 0; x < 356; x += 7, i++) {
    const tope = alturaMontana(x) + 6;
    const filas = Math.max(0, Math.floor((76 - tope) / 7));
    for (let f = 0; f < filas; f++) {
      if ((i * 7 + f * 3) % 3 === 0) continue; // huecos para que no sea un bloque
      const y = 74 - f * 7 - ((i % 2) * 2);
      r += `<rect x="${x}" y="${y - 4}" width="6" height="5" class="m-ladrillo"/>`;
      if ((i + f) % 3 === 0) r += `<rect x="${x + 2}" y="${y - 3}" width="2" height="2" class="m-ventana"/>`;
    }
  }
  return `<g class="m-laderas">${r}</g>`;
}

// Edificios del centro, con una torre de aguja.
const centro = (x, y) => `
  <g transform="translate(${x} ${y})" class="m-centro">
    <rect x="-52" y="-34" width="18" height="34" class="m-edificio"/>
    <rect x="-32" y="-48" width="16" height="48" class="m-edificio m-edificio--b"/>
    <rect x="-12" y="-70" width="16" height="70" class="m-edificio m-aguja"/>
    <polygon points="-12,-70 -4,-96 4,-70" class="m-edificio m-aguja"/>
    <rect x="-5" y="-108" width="2" height="14" class="m-edificio m-aguja"/>
    <rect x="8" y="-40" width="20" height="40" class="m-edificio m-edificio--b"/>
    <rect x="30" y="-26" width="16" height="26" class="m-edificio"/>
    ${[[-48, -28], [-42, -20], [-28, -40], [-22, -30], [-28, -16], [-8, -60], [-2, -48], [-8, -36], [-2, -22], [12, -32], [20, -24], [12, -14], [34, -18]]
      .map(([a, b]) => `<rect x="${a}" y="${b}" width="3" height="3" class="m-ventana"/>`).join('')}
  </g>`;

// Metro elevado junto al río: viaducto, columnas y un tren de tres vagones.
const metro = (y, desde, hasta) => {
  let columnas = '';
  for (let x = desde + 10; x < hasta; x += 34) columnas += `<rect x="${x}" y="${y}" width="5" height="22" class="m-viaducto"/>`;
  const vagon = (x) => `<rect x="${x}" y="-12" width="30" height="12" class="m-vagon"/><rect x="${x}" y="-6" width="30" height="2" class="m-franja"/>
    <rect x="${x + 4}" y="-10" width="5" height="4" class="m-ventana"/><rect x="${x + 12}" y="-10" width="5" height="4" class="m-ventana"/><rect x="${x + 20}" y="-10" width="5" height="4" class="m-ventana"/>`;
  return `<g class="m-metro">${columnas}
    <rect x="${desde}" y="${y - 3}" width="${hasta - desde}" height="5" class="m-viaducto"/>
    <g transform="translate(0 ${y - 3})"><g class="m-tren">${vagon(0)}${vagon(32)}${vagon(64)}</g></g>
  </g>`;
};

// Escaleras eléctricas en la ladera, con techo naranja y casas pintadas con grafiti.
const escaleras = (x, y) => {
  let pasos = '';
  for (let i = 0; i < 7; i++) pasos += `<rect x="${x - 30 + i * 10}" y="${y - i * 8}" width="12" height="4" class="m-paso"/>`;
  const casas = [[-44, -20, 'a'], [-34, -40, 'b'], [18, -10, 'c'], [30, -34, 'a'], [8, -58, 'b'], [-20, -52, 'c']]
    .map(([a, b, c]) => `<rect x="${x + a}" y="${y + b}" width="12" height="10" class="m-grafiti m-grafiti--${c}"/><rect x="${x + a + 2}" y="${y + b + 2}" width="3" height="3" class="m-ventana"/>`).join('');
  return `<g class="m-escaleras">
    <polygon points="${x - 60},${y + 10} ${x + 10},${y - 66} ${x + 60},${y + 10}" class="m-loma"/>
    ${casas}${pasos}
    <polygon points="${x - 32},${y - 8} ${x + 40},${y - 64} ${x + 44},${y - 58} ${x - 28},${y - 2}" class="m-techo-escalera"/>
  </g>`;
};

// Silleta de flores.
const silleta = (x, y) => {
  const colores = ['a', 'b', 'c', 'd'];
  let flores = '';
  [[-10, -24], [-2, -26], [6, -24], [-12, -16], [-4, -18], [4, -17], [10, -15], [-8, -9], [0, -10], [8, -8]]
    .forEach(([a, b], i) => { flores += `<rect x="${x + a}" y="${y + b}" width="6" height="6" class="m-flor-s m-flor-s--${colores[i % 4]}"/>`; });
  return `<g class="m-silleta">
    <rect x="${x - 15}" y="${y - 2}" width="32" height="4" class="m-madera"/>
    <rect x="${x - 15}" y="${y - 30}" width="3" height="32" class="m-madera"/><rect x="${x + 14}" y="${y - 30}" width="3" height="32" class="m-madera"/>
    ${flores}
  </g>`;
};

// Chiva: bus de escalera de colores.
const chiva = (x, y) => `
  <g transform="translate(${x} ${y})" class="m-chiva">
    <rect x="-26" y="-30" width="52" height="4" class="m-madera"/>
    <rect x="-20" y="-36" width="8" height="6" class="m-flor-s m-flor-s--a"/><rect x="-8" y="-36" width="10" height="6" class="m-flor-s m-flor-s--c"/><rect x="6" y="-36" width="8" height="6" class="m-flor-s m-flor-s--d"/>
    <rect x="-26" y="-26" width="52" height="22" class="m-chiva-cuerpo"/>
    <rect x="-26" y="-10" width="52" height="3" class="m-flor-s m-flor-s--b"/><rect x="-26" y="-7" width="52" height="3" class="m-flor-s m-flor-s--c"/>
    ${[-22, -12, -2, 8].map((a) => `<rect x="${a}" y="-22" width="7" height="8" class="m-ventana"/>`).join('')}
    <rect x="18" y="-22" width="6" height="12" class="m-vidrio"/>
    <rect x="-20" y="-4" width="9" height="9" class="m-rueda"/><rect x="11" y="-4" width="9" height="9" class="m-rueda"/>
  </g>`;

function terreno() {
  return `
  <defs>
    <pattern id="m-cuadros" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" class="m-pasto"/>
      <rect width="12" height="12" class="m-pasto-2"/><rect x="12" y="12" width="12" height="12" class="m-pasto-2"/>
    </pattern>
  </defs>
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#m-cuadros)"/>
  <!-- montañas del fondo -->
  <rect width="${ANCHO}" height="80" class="m-cielo"/>
  <g class="m-noche"><rect x="30" y="10" width="2" height="2"/><rect x="90" y="26" width="2" height="2"/><rect x="160" y="8" width="2" height="2"/><rect x="230" y="20" width="2" height="2"/><rect x="200" y="44" width="2" height="2"/><rect x="60" y="48" width="2" height="2"/></g>
  <g class="m-luna"><rect x="318" y="14" width="18" height="18"/><rect x="326" y="12" width="14" height="14" class="m-cielo"/></g>
  <g class="m-sol"><rect x="316" y="12" width="20" height="20"/><path d="M 326 4 v 4 M 326 36 v 4 M 308 22 h 4 M 340 22 h 4" class="m-rayos"/></g>
  <polygon points="0,78 0,66 40,24 80,60 120,14 170,58 210,28 260,62 300,22 360,66 360,78" class="m-montana"/>
  ${laderas()}
  ${nube(110, Y(70))}${nube(200, Y(540))}${nube(310, Y(760))}
  <!-- el centro -->
  ${centro(296, Y(132))}
  <!-- río -->
  <path d="M -10 ${Y(360)} C 60 ${Y(340)}, 120 ${Y(390)}, 180 ${Y(372)} S 300 ${Y(330)}, 370 ${Y(352)} L 370 ${Y(382)} C 300 ${Y(362)}, 240 ${Y(404)}, 180 ${Y(402)} S 60 ${Y(370)}, -10 ${Y(390)} Z" class="m-agua"/>
  <path d="M 20 ${Y(374)} h 14 M 120 ${Y(386)} h 14 M 240 ${Y(370)} h 14 M 320 ${Y(362)} h 12" class="m-ola"/>
  <!-- metro elevado junto al río -->
  ${metro(Y(414), -10, 226)}
  <!-- escaleras eléctricas en la ladera -->
  ${escaleras(300, Y(592))}
  <!-- metrocable subiendo la ladera -->
  <line x1="16" y1="1046" x2="176" y2="968" class="m-cable"/>
  <rect x="12" y="1046" width="7" height="30" class="m-torre"/><rect x="172" y="968" width="7" height="30" class="m-torre"/>
  <g class="m-cabina"><line x1="66" y1="1022" x2="66" y2="1030" class="m-cable"/><rect x="57" y="1030" width="18" height="14"/></g>
  <g class="m-cabina"><line x1="128" y1="992" x2="128" y2="1000" class="m-cable"/><rect x="119" y="1000" width="18" height="14"/></g>
  <!-- barrios -->
  ${casa(30, Y(250), 'm-casa--b')}${casa(56, Y(240), 'm-casa--ladrillo')}
  ${casa(320, Y(300))}${casa(200, Y(500), 'm-casa--b')}${casa(30, Y(640), 'm-casa--ladrillo')}${casa(330, Y(840), 'm-casa--b')}${casa(50, Y(900), 'm-casa--ladrillo')}
  <!-- árboles -->
  ${arbol(170, Y(250), 1, 'm-guayacan')}${arbol(186, Y(268), 0.8)}${arbol(330, Y(200), 1, 'm-guayacan--rosa')}${arbol(30, Y(160), 0.9)}
  ${silleta(70, Y(486))}${arbol(186, Y(470), 0.9)}${arbol(30, Y(450), 0.8, 'm-guayacan')}${arbol(330, Y(470), 1, 'm-guayacan')}${arbol(310, Y(710), 0.9, 'm-guayacan--rosa')}
  ${arbol(30, Y(820), 1, 'm-guayacan')}${arbol(190, Y(820), 0.8)}${arbol(330, Y(960), 0.9, 'm-guayacan--rosa')}
  <!-- chiva -->
  ${chiva(150, Y(985))}
  <!-- flores -->
  <g class="m-flor"><rect x="140" y="${Y(160)}" width="4" height="4"/><rect x="236" y="${Y(330)}" width="4" height="4"/><rect x="60" y="${Y(600)}" width="4" height="4"/><rect x="290" y="${Y(790)}" width="4" height="4"/><rect x="140" y="${Y(930)}" width="4" height="4"/></g>
  <!-- camino -->
  <path d="${camino(PUNTOS)}" class="m-camino-borde"/>
  <path d="${camino(PUNTOS)}" class="m-camino" id="m-ruta"/>
  <path d="${camino(PUNTOS)}" class="m-camino-puntos"/>
  <!-- castillo final -->
  <g transform="translate(286 ${Y(968)})" class="m-castillo">
    <rect x="-34" y="-34" width="68" height="34"/><rect x="-42" y="-50" width="18" height="50"/><rect x="24" y="-50" width="18" height="50"/>
    <rect x="-42" y="-58" width="6" height="8"/><rect x="-30" y="-58" width="6" height="8"/><rect x="24" y="-58" width="6" height="8"/><rect x="36" y="-58" width="6" height="8"/>
    <rect x="-8" y="-18" width="16" height="18" class="m-puerta"/>
    <line x1="0" y1="-34" x2="0" y2="-62" class="m-asta"/><polygon points="0,-62 16,-56 0,-50" class="m-bandera-castillo"/>
  </g>
  <!-- inicio -->
  <g transform="translate(${PUNTOS[0][0]} ${PUNTOS[0][1] - 78})" class="m-inicio">
    <rect x="-28" y="-12" width="56" height="18"/><text x="0" y="2" text-anchor="middle">INICIO</text>
  </g>`;
}

function personaje() {
  // Sprite de 8x8 "píxeles" (cada píxel = 3 unidades)
  const filas = [
    '..xxxx..', '.xxxxxx.', '..ffff..', '.f.ff.f.', '..ffff..', '.bbbbbb.', '..b..b..', '.zz..zz.',
  ];
  let r = '';
  filas.forEach((f, y) => [...f].forEach((c, x) => {
    if (c !== '.') r += `<rect x="${x * 3}" y="${y * 3}" width="3" height="3" class="p-${c}"/>`;
  }));
  return `<svg viewBox="0 0 24 24" width="36" height="36" class="personaje" aria-hidden="true">${r}</svg>`;
}

/**
 * misiones: [{ m, abierta, completa, estado, nivelesHechos, totalNiveles }]
 * actual: número de la misión donde está el personaje
 */
export function mundo(misiones, actual, sprite = '') {
  const svg = h('div', { class: 'mundo__terreno', 'aria-hidden': 'true', html: `<svg viewBox="0 0 ${ANCHO} ${ALTO}" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges">${terreno()}</svg>` });

  const lista = h('ol', { class: 'mundo__checkpoints', 'aria-label': 'Mapa de misiones' },
    misiones.map((info, i) => {
      const [x, y] = PUNTOS[i] || PUNTOS[PUNTOS.length - 1];
      const lado = x < ANCHO / 2 ? 'der' : 'izq';
      const { m, abierta, completa, estado } = info;
      const clase = completa ? 'cp--completo' : abierta ? 'cp--abierto' : 'cp--pronto';
      const esFinal = i === misiones.length - 1;
      return h('li', {
        class: `cp ${clase} cp--${lado} color-${m.color || 'naranja'}`,
        style: `left:${(x / ANCHO) * 100}%;top:${(y / ALTO) * 100}%`,
      },
      h('a', { class: 'cp__enlace', href: `#/mision/${m.numero}`, 'aria-label': `Misión ${m.numero}: ${m.titulo}. ${estado}${m.numero === actual ? '. Estás aquí' : ''}` },
        h('span', { class: 'cp__punto', 'aria-hidden': 'true' },
          completa ? '★' : abierta ? String(m.numero) : '🔒'),
        h('span', { class: 'cp__cartel', 'aria-hidden': 'true' },
          h('span', { class: 'cp__num' }, rotulo(`${esFinal ? 'Gran reto · ' : ''}Misión ${pad2(m.numero)}`)),
          h('span', { class: 'cp__titulo' }, m.titulo),
          h('span', { class: 'cp__estado' }, estado))),
      completa ? h('span', { class: 'cp__bandera', 'aria-hidden': 'true' }) : null);
    }));

  const idx = Math.max(0, misiones.findIndex((x) => x.m.numero === actual));
  const jugador = h('span', { class: 'mundo__jugador', 'aria-hidden': 'true', html: sprite || personaje() });
  const ubicar = ([x, y]) => { jugador.style.left = `${(x / ANCHO) * 100}%`; jugador.style.top = `${(y / ALTO) * 100}%`; };
  ubicar(PUNTOS[idx]);

  const caja = h('div', { class: 'mundo' }, svg, lista, jugador);
  caja.caminar = (desde) => caminar(caja, jugador, ubicar, desde, idx);
  return caja;
}

/** Hace caminar al personaje por el camino desde el checkpoint `desde` (0 = INICIO) hasta el actual. */
function caminar(caja, jugador, ubicar, desde, hasta) {
  const ruta = caja.querySelector('#m-ruta');
  if (!ruta || reducirMovimiento() || desde - 1 >= hasta) return;
  const total = ruta.getTotalLength();
  const largoEn = ([px, py]) => {
    let mejor = 0; let dist = Infinity;
    for (let l = 0; l <= total; l += 2) {
      const pt = ruta.getPointAtLength(l);
      const d = (pt.x - px) ** 2 + (pt.y - py) ** 2;
      if (d < dist) { dist = d; mejor = l; }
    }
    return mejor;
  };
  const l0 = desde <= 0 ? 0 : largoEn(PUNTOS[desde - 1]);
  const l1 = largoEn(PUNTOS[hasta]);
  const dur = Math.min(4000, 900 + (l1 - l0) * 3);
  const t0 = performance.now();
  jugador.classList.add('mundo__jugador--camina');
  const cuadro = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const pt = ruta.getPointAtLength(l0 + (l1 - l0) * k);
    ubicar([pt.x, pt.y]);
    if (k < 1) requestAnimationFrame(cuadro);
    else { jugador.classList.remove('mundo__jugador--camina'); ubicar(PUNTOS[hasta]); }
  };
  requestAnimationFrame(cuadro);
}
