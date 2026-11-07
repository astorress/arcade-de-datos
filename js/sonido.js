// Sonidos 8-bit generados con Web Audio (sin archivos). Apagados por defecto: se activan en Ajustes.
import * as store from './store.js';

let ctx = null;

function audio() {
  if (!store.ajustes().sonido) return null;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (_) {
    return null;
  }
}

/** notas: [[frecuencia Hz, duración s], ...] tocadas en secuencia con onda cuadrada. */
function tocar(notas, { tipo = 'square', volumen = 0.06 } = {}) {
  const a = audio();
  if (!a) return;
  let t = a.currentTime + 0.01;
  for (const [f, d] of notas) {
    if (f > 0) {
      const osc = a.createOscillator();
      const g = a.createGain();
      osc.type = tipo;
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(volumen, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d * 0.95);
      osc.connect(g).connect(a.destination);
      osc.start(t);
      osc.stop(t + d);
    }
    t += d;
  }
}

const N = { C5: 523, D5: 587, E5: 659, G5: 784, A5: 880, C6: 1047, E6: 1319, G4: 392, A4: 440, E4: 330, C4: 262 };

export const sonido = {
  bien: () => tocar([[N.E5, 0.07], [N.A5, 0.12]]),
  // Suave y corto: es "miremos juntos", no "perdiste".
  casi: () => tocar([[N.A4, 0.08], [N.G4, 0.12]], { tipo: 'triangle', volumen: 0.08 }),
  pista: () => tocar([[N.C6, 0.05], [N.E6, 0.07]], { tipo: 'triangle', volumen: 0.05 }),
  paso: () => tocar([[N.C5, 0.05]], { volumen: 0.04 }),
  nivel: () => tocar([[N.C5, 0.1], [N.E5, 0.1], [N.G5, 0.1], [N.C6, 0.25]]),
  insignia: () => tocar([[N.G4, 0.09], [N.C5, 0.09], [N.E5, 0.09], [N.G5, 0.09], [0, 0.05], [N.E5, 0.09], [N.G5, 0.09], [N.C6, 0.35]]),
  prueba: () => tocar([[N.C5, 0.08], [N.E5, 0.08], [N.G5, 0.14]]),
};
