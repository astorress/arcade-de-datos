import { reducirMovimiento } from '../util.js';

const COLORES = ['#FF7C1A', '#CB318E', '#7FC200', '#F5C431', '#9FD8F5', '#F3EEE3'];

/** Confeti pixel que cae sobre el contenedor. No hace nada si la persona pidió reducir el movimiento. */
export function confeti(contenedor, cantidad = 70) {
  if (reducirMovimiento() || !contenedor) return;
  const capa = document.createElement('div');
  capa.className = 'confeti';
  capa.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < cantidad; i++) {
    const p = document.createElement('span');
    const tam = 6 + Math.floor(Math.random() * 3) * 3;
    p.style.cssText = `left:${Math.random() * 100}%;width:${tam}px;height:${tam}px;background:${COLORES[i % COLORES.length]};`
      + `animation-delay:${(Math.random() * 0.8).toFixed(2)}s;animation-duration:${(1.8 + Math.random() * 1.4).toFixed(2)}s;`
      + `--deriva:${Math.round((Math.random() - 0.5) * 120)}px;`;
    capa.appendChild(p);
  }
  contenedor.appendChild(capa);
  setTimeout(() => capa.remove(), 4000);
}
