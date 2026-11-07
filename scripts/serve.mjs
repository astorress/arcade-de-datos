// Servidor estático mínimo para desarrollo y vista previa. Sin dependencias.
// Uso: node scripts/serve.mjs [carpeta] [puerto]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CARPETA = resolve(RAIZ, process.argv[2] || '.');
const PUERTO = Number(process.argv[3] || process.env.PORT || 5180);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let archivo = normalize(join(CARPETA, ruta));
    if (!archivo.startsWith(CARPETA)) { res.writeHead(403).end(); return; }
    if ((await stat(archivo).catch(() => null))?.isDirectory()) archivo = join(archivo, 'index.html');
    const cuerpo = await readFile(archivo);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(cuerpo);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
}).listen(PUERTO, '0.0.0.0', () => {
  console.log(`Arcade de Datos sirviendo ${CARPETA.replace(RAIZ, '.') || '.'} en http://localhost:${PUERTO}`);
});
