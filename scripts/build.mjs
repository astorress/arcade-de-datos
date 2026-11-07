// Compila el sitio a dist/: valida el contenido, copia los archivos y prepara el modo sin conexión.
// Sin dependencias: `node scripts/build.mjs`.
import { execFileSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
const INCLUIR = ['index.html', 'manifest.webmanifest', 'assets', 'js', 'content'];

execFileSync(process.execPath, [join(RAIZ, 'scripts', 'check.mjs')], { stdio: 'inherit' });

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST);
for (const item of INCLUIR) cpSync(join(RAIZ, item), join(DIST, item), { recursive: true, filter: (src) => !src.endsWith('.DS_Store') });

function listar(dir) {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? listar(ruta) : [ruta];
  });
}

const archivos = listar(DIST).filter((r) => !r.endsWith('OFL.txt')).sort();
const hash = createHash('sha256');
archivos.forEach((r) => hash.update(relative(DIST, r)).update(readFileSync(r)));
const version = hash.digest('hex').slice(0, 10);
const lista = ['./', ...archivos.map((r) => `./${relative(DIST, r)}`)];

const sw = readFileSync(join(RAIZ, 'sw.js'), 'utf8')
  .replace('__VERSION__', version)
  .replace('__ARCHIVOS__', JSON.stringify(lista, null, 2));
writeFileSync(join(DIST, 'sw.js'), sw);
writeFileSync(join(DIST, '.nojekyll'), '');

const kb = Math.round(archivos.reduce((t, r) => t + statSync(r).size, 0) / 1024);
console.log(`✓ Sitio compilado en dist/ (versión ${version}, ${lista.length - 1} archivos, ${kb} KB).`);
