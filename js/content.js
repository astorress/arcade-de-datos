// Carga del contenido (archivos JSON en /content). Nada de esto está en el código.

const BASE = new URL('../content/', import.meta.url);

let cache = null;

async function json(ruta) {
  const r = await fetch(new URL(ruta, BASE), { cache: 'no-cache' });
  if (!r.ok) throw new Error(`No se pudo cargar ${ruta} (${r.status})`);
  return r.json();
}

export async function cargarTodo() {
  if (cache) return cache;
  const [sitio, glosario, indice] = await Promise.all([
    json('sitio.json'),
    json('glosario.json'),
    json('misiones/indice.json'),
  ]);
  const misiones = await Promise.all(
    indice.misiones.map((archivo) =>
      json(`misiones/${archivo}`).catch((e) => {
        console.error(e);
        return null;
      })
    )
  );
  cache = {
    sitio,
    glosario: glosario.terminos || [],
    misiones: misiones.filter(Boolean).sort((a, b) => a.numero - b.numero),
  };
  return cache;
}

export function disponible(m) {
  return m && m.estado === 'disponible' && Array.isArray(m.niveles) && m.niveles.length > 0;
}

export function buscarMision(contenido, n) {
  return contenido.misiones.find((m) => m.numero === Number(n));
}
