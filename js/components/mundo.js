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

const arbol = (x, y, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})" class="m-arbol">
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
  <polygon points="300,22 312,34 288,34" class="m-nieve"/><polygon points="120,14 132,26 108,26" class="m-nieve"/>
  ${nube(300, Y(90))}${nube(60, Y(470))}${nube(310, Y(760))}
  <!-- río -->
  <path d="M -10 ${Y(360)} C 60 ${Y(340)}, 120 ${Y(390)}, 180 ${Y(372)} S 300 ${Y(330)}, 370 ${Y(352)} L 370 ${Y(382)} C 300 ${Y(362)}, 240 ${Y(404)}, 180 ${Y(402)} S 60 ${Y(370)}, -10 ${Y(390)} Z" class="m-agua"/>
  <path d="M 20 ${Y(374)} h 14 M 120 ${Y(386)} h 14 M 240 ${Y(370)} h 14 M 320 ${Y(362)} h 12" class="m-ola"/>
  <!-- lago -->
  <ellipse cx="190" cy="${Y(600)}" rx="40" ry="22" class="m-agua"/>
  <path d="M 176 ${Y(598)} h 12 M 194 ${Y(606)} h 12" class="m-ola"/>
  <!-- metrocable -->
  <line x1="140" y1="${Y(720)}" x2="350" y2="${Y(690)}" class="m-cable"/>
  <rect x="138" y="${Y(720)}" width="6" height="30" class="m-torre"/><rect x="346" y="${Y(690)}" width="6" height="30" class="m-torre"/>
  <g class="m-cabina"><rect x="236" y="${Y(705) + 6}" width="18" height="14"/><line x1="245" y1="${Y(705) - 2}" x2="245" y2="${Y(705) + 6}" class="m-cable"/></g>
  <!-- barrios -->
  ${casa(200, Y(110))}${casa(226, Y(124), 'm-casa--b')}${casa(30, Y(250), 'm-casa--b')}${casa(56, Y(240))}
  ${casa(320, Y(300))}${casa(200, Y(500), 'm-casa--b')}${casa(30, Y(640))}${casa(330, Y(840), 'm-casa--b')}${casa(50, Y(900))}
  <!-- árboles -->
  ${arbol(170, Y(250))}${arbol(186, Y(268), 0.8)}${arbol(330, Y(200))}${arbol(30, Y(160), 0.9)}
  ${arbol(176, Y(460))}${arbol(30, Y(450), 0.8)}${arbol(330, Y(470))}${arbol(180, Y(700))}${arbol(310, Y(710), 0.9)}
  ${arbol(30, Y(820))}${arbol(190, Y(820), 0.8)}${arbol(176, Y(960))}${arbol(330, Y(960), 0.9)}
  <!-- flores -->
  <g class="m-flor"><rect x="140" y="${Y(160)}" width="4" height="4"/><rect x="236" y="${Y(330)}" width="4" height="4"/><rect x="60" y="${Y(600)}" width="4" height="4"/><rect x="290" y="${Y(790)}" width="4" height="4"/><rect x="140" y="${Y(930)}" width="4" height="4"/></g>
  <!-- camino -->
  <path d="${camino(PUNTOS)}" class="m-camino-borde"/>
  <path d="${camino(PUNTOS)}" class="m-camino" id="m-ruta"/>
  <path d="${camino(PUNTOS)}" class="m-camino-puntos"/>
  <!-- puente sobre el río -->
  
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
