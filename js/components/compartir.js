import { aviso } from '../util.js';
import { SIMBOLOS } from './insignia.js';

const COLOR = { naranja: '#FF7C1A', magenta: '#CB318E', verde: '#7FC200' };

function cargarImagen(svg) {
  return new Promise((ok, falla) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = falla;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function octagono(ctx, cx, cy, r) {
  const k = r * 0.42;
  ctx.beginPath();
  [[-k, -r], [k, -r], [r, -k], [r, k], [k, r], [-k, r], [-r, k], [-r, -k]].forEach(([x, y], i) => (i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y)));
  ctx.closePath();
}

function textoAjustado(ctx, texto, x, y, ancho, alto) {
  const palabras = texto.split(' ');
  let linea = '';
  for (const p of palabras) {
    const prueba = linea ? `${linea} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && linea) { ctx.fillText(linea, x, y); linea = p; y += alto; } else linea = prueba;
  }
  ctx.fillText(linea, x, y);
}

/** Genera una imagen PNG (1080 x 1080) de la insignia con el personaje. Sin datos personales: solo el apodo opcional. */
export async function imagenInsignia({ mision, sprite, nombreJugador, nombreSitio }) {
  try { await document.fonts.load('60px Pixel'); } catch (_) { /* usa la fuente de respaldo */ }
  const L = 1080;
  const cv = document.createElement('canvas');
  cv.width = L; cv.height = L;
  const ctx = cv.getContext('2d');
  const color = COLOR[mision.color] || COLOR.naranja;

  ctx.fillStyle = '#1E1B33';
  ctx.fillRect(0, 0, L, L);
  ctx.fillStyle = '#231F3C';
  for (let y = 0; y < L; y += 40) for (let x = (y / 40) % 2 ? 40 : 0; x < L; x += 80) ctx.fillRect(x, y, 40, 40);
  ctx.strokeStyle = '#FF7C1A'; ctx.lineWidth = 24; ctx.strokeRect(12, 12, L - 24, L - 24);
  ctx.strokeStyle = '#CB318E'; ctx.lineWidth = 8; ctx.strokeRect(40, 40, L - 80, L - 80);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF8F3D';
  ctx.font = '110px Pixel, monospace';
  ctx.fillText('¡INSIGNIA GANADA!', L / 2, 170);

  // Insignia
  const cx = L / 2; const cy = 450; const r = 200;
  octagono(ctx, cx + 12, cy + 12, r); ctx.fillStyle = '#120F22'; ctx.fill();
  octagono(ctx, cx, cy, r); ctx.fillStyle = '#363157'; ctx.fill();
  ctx.lineWidth = 18; ctx.strokeStyle = color; ctx.stroke();
  ctx.fillStyle = color; ctx.fillRect(cx - 140, cy + 70, 280, 70);
  ctx.fillStyle = '#1E1B33'; ctx.font = '92px Pixel, monospace';
  ctx.fillText(`M${String(mision.numero).padStart(2, '0')}`, cx, cy + 125);
  ctx.font = '150px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.fillText(SIMBOLOS[mision.insignia?.simbolo] || '★', cx, cy + 30);

  // Nombre de la insignia
  ctx.fillStyle = '#F3EEE3'; ctx.font = '92px Pixel, monospace';
  ctx.fillText(mision.insignia?.nombre || '', L / 2, 760);

  // Personaje + texto
  try {
    const img = await cargarImagen(sprite);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 110, 800, 192, 180);
  } catch (_) { /* sin personaje */ }
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9BDB2A'; ctx.font = '60px Pixel, monospace';
  ctx.fillText(nombreJugador.toUpperCase(), 340, 860);
  ctx.fillStyle = '#CFC8DD'; ctx.font = '36px Arial, sans-serif';
  textoAjustado(ctx, `completó la Misión ${mision.numero}: ${mision.titulo}`, 340, 912, 640, 44);
  ctx.textAlign = 'center'; ctx.fillStyle = '#CFC8DD'; ctx.font = '40px Pixel, monospace';
  ctx.fillText(nombreSitio, L / 2, 1030);

  return new Promise((ok) => cv.toBlob(ok, 'image/png'));
}

export async function compartirInsignia(datos) {
  const blob = await imagenInsignia(datos);
  if (!blob) return aviso('No se pudo crear la imagen.');
  const archivo = new File([blob], `insignia-mision-${datos.mision.numero}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: `Insignia: ${datos.mision.insignia?.nombre}`, text: `¡Gané la insignia «${datos.mision.insignia?.nombre}» en ${datos.nombreSitio}!` });
      return;
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = archivo.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  aviso('Imagen descargada. Puedes enviarla por WhatsApp.');
}
