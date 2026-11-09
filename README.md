# Arcade de Datos

Página web de apoyo, con estética de videojuego arcade, hecha por Sebastian Torres para que sus estudiantes de análisis de datos repasen y practiquen entre sesiones. Una misión por sesión (8 en total) en un mapa de mundo tipo videojuego. Cada misión trae una **guía de teoría** («Recordemos»: qué se ve en las clases asincrónicas y los conceptos que necesitas para el reto), 3 niveles, pistas, retroalimentación que explica el porqué, cuaderno local, hoja imprimible e insignia.

- **Personaje personalizable** (estilo de cabeza, colores, nombre de jugador opcional y accesorios que se desbloquean con cada insignia). Recorre el mapa y aparece en la barra superior.
- **Profe Dato**, un guía pixel que cuenta la historia y acompaña cada acierto y cada error en cajas de diálogo (sus frases están en `content/sitio.json` → `guia`).
- **Repaso relámpago** (`#/repaso`): 5 preguntas al azar de lo ya jugado, sin tiempo ni puntos.
- **Glosario como álbum de cartas** coleccionables (todas se pueden leer siempre).
- **Modo clase** (`#/clase/N`): diapositivas generadas desde la misión para proyectar en la sesión; flechas del teclado, `R` muestra la respuesta.
- **Compartir insignia**: genera una imagen PNG (insignia + personaje) para WhatsApp.
- **Sonidos 8-bit** opcionales (apagados por defecto), **confeti** al superar niveles y un **mapa vivo** (día en modo claro, noche en modo oscuro, el personaje camina por el camino). Todo respeta «reducir movimiento».
- **Íconos pixel propios** (`js/components/iconos.js`): los emojis de la interfaz se traducen automáticamente a íconos para que se vean igual en todos los celulares. Muestra en `tests/iconos.html`.
- **Sin cuentas ni datos personales.** El progreso se guarda solo en el navegador (`localStorage`). Hay un botón «Borrar mi progreso».
- **Mobile first** (probado a 360 px), accesible (contraste AA, teclado, lector de pantalla, `prefers-reduced-motion`), modo claro/oscuro y tamaño de letra ajustable.
- **Sin dependencias ni IA en tiempo de ejecución.** HTML + CSS + JavaScript con módulos nativos. Funciona sin conexión después de la primera visita.
- **El contenido está separado del código:** cada misión es un archivo JSON en `content/misiones/`.

## Enfoque pedagógico

| Principio | Cómo se ve en la página |
|---|---|
| Aprendizaje basado en retos | El Nivel 3 de cada misión es el reto de la clase, con contexto, restricciones, producto, criterios (lista de verificación) y tres rutas. |
| Ciclo de Kolb | Cada actividad está marcada con su fase (Hacer → Observar → Entender → Aplicar) y el indicador la muestra arriba. |
| Hacer antes que leer | La misión empieza con una actividad. La teoría está siempre a mano pero plegada («Recordemos» en cada actividad) o en su propia guía. |
| Conexión con las clases asincrónicas | La guía de teoría dice qué módulo de Data1, Data2 y Data3 se aplica, se anticipa o se retoma en esa sesión (según la matriz metodológica). |
| Error productivo | Nunca dice «Incorrecto». Cada error común tiene su mensaje: reconoce, señala una cosa y da el siguiente paso. Se puede reintentar sin límite. |
| Andamiaje | Pistas progresivas (pista 1, pista 2, solución) y ejemplo resuelto que se abre después de intentarlo. |
| Honestidad con los datos | Siempre hay una pregunta sobre lo que **no** se puede afirmar. |
| Personaje propio | Cada insignia desbloquea un accesorio (lupa, escoba, regla…). El avance se ve en el mapa, no en un ranking. |
| Progreso visible sin presión | Puntos e insignias que premian completar, no la rapidez. Sin temporizadores, vidas ni ranking. Las pistas no restan. |

## Correr el proyecto en tu máquina

No necesitas Node en tu Mac: todo corre en Docker. Hay dos formas (usa una a la vez, porque comparten los puertos 5180 y 4180).

### 1. Con `make` (rápido)

```bash
make dev       # sitio en http://localhost:5180 (recarga la página para ver cambios)
make check     # valida los archivos de contenido
make build     # valida y compila en dist/
make preview   # compila y sirve dist/ en http://localhost:4180, tal como quedará publicado
make down      # detiene el contenedor
```

### 2. Con el devcontainer de VS Code

Requiere la extensión **Dev Containers** (`ms-vscode-remote.remote-containers`).

1. Abre la carpeta `estudia-arcade/` en VS Code y elige **Reopen in Container**.
2. Al crearse, el contenedor valida el contenido (`.docker/entrypoint.sh`).
3. En la terminal del contenedor:

```bash
npm run dev       # http://localhost:5180
npm run check
npm run build
npm run preview   # http://localhost:4180
```

Toda la configuración de Docker vive en `.docker/`: `Dockerfile` (una sola etapa), `docker-compose.yml` (el mismo para `make dev` y para el devcontainer) y `entrypoint.sh`. En el devcontainer el contenedor queda en espera (`overrideCommand`) y tú arrancas el sitio con `npm run dev`.

### Prueba de punta a punta

Con el sitio corriendo, abre <http://localhost:5180/tests/e2e.html>. Juega la Misión 1 completa (respuestas erradas y correctas) y muestra `FALLOS: 0` si todo está bien. **Ojo:** borra el progreso de ese navegador.

## Estructura

```
index.html                  Esqueleto de la página
.docker/                    Dockerfile, docker-compose.yml y entrypoint.sh del devcontainer
assets/css/styles.css       Estilos: acentos naranja, magenta y verde sobre fondos arcade suaves
                            (oscuro: índigo #1E1B33 · claro: crema #F3ECDD; nada de negro ni blanco puros)
assets/fonts/               Jersey 10 recortada al español (licencia OFL)
js/main.js                  Rutas, ajustes y arranque
js/store.js                 Progreso y cuaderno en localStorage
js/content.js               Carga de content/
js/views/                   Pantallas (mapa, misión, nivel, teoría, glosario, progreso, ayuda, cuaderno, para llevar)
js/actividades/             Un archivo por tipo de actividad + index.js (registro)
js/components/              Tabla de datos, insignia, indicador de Kolb, mapa de mundo (mundo.js), personaje (personaje.js)
content/sitio.json          Nombre, textos generales, fases de Kolb, puntos
content/glosario.json       Términos del glosario (crece con cada misión)
content/misiones/           indice.json + mision-01.json … mision-08.json
scripts/                    check.mjs (valida), build.mjs (compila), serve.mjs (servidor local)
tests/e2e.html              Prueba de punta a punta de la Misión 1
```

## Panel de control: abrir misiones y elegir el caso

Todo se maneja desde **un solo archivo**: `content/panel-de-control.js`.

```js
export default {
  1: { abierta: true, caso: 'ambos' },
  2: { abierta: false, caso: 'cotidiano' },
  3: { abierta: false, caso: 'guia' },
  // …
};
```

- `abierta`: `true` para que los estudiantes la jueguen, `false` para verla bloqueada («Próximamente», con la teoría disponible). También vale `'si'`/`'no'` u `'on'`/`'off'`.
- `caso`: todas las misiones traen dos casos completos: `'cotidiano'` (vida diaria) y `'guia'` (el de la guía oficial). Con `'ambos'` la misión muestra los dos casos para practicar más; la insignia se gana terminando cualquiera de los dos.

**Antes de cada clase:**
1. Revisa la misión bloqueada abriendo el sitio con `?previa` (por ejemplo `https://astorress.github.io/arcade-de-datos/?previa`). Ves todas las misiones y, arriba de cada una, botones para cambiar de caso. Solo afecta a tu pestaña; `?previa=0` la apaga.
2. Cambia `abierta` y `caso` en el panel.
3. `make panel` (o `make check`) muestra el estado de todas las misiones y avisa si escribiste algo mal.
4. Commit y push: GitHub Pages publica en 1 o 2 minutos. Si hay un error en el panel, la publicación se detiene y el sitio sigue como estaba.

Las cifras de control de cada caso, para la clase, están en `Planeación/Clase_0N/Clase_0N_Casos_y_cifras.md`.

## Cómo editar el contenido de una misión

1. Abre `content/misiones/mision-0N.json`. Las misiones con dos casos tienen `casos.cotidiano` y `casos.guia`, cada uno con `nombre`, `titulo`, `caso`, `historia`, `datos`, `niveles`, `conceptos`, `fraseClave` y `paraLlevar`. La teoría (`teoria`) es común a los dos casos.
2. Agrega términos a `content/glosario.json` con `"mision": N` si hace falta.
3. Corre `make check`. Te dice exactamente qué falta o qué está mal.

No hay que tocar código. Una actividad puede mostrar apoyos visuales en `apoyo` (uno o una lista): `texto`, `tabla`, `comparacion` o `grafico` (barras o líneas, ver `js/components/grafico.js`).

En los textos puedes usar `**negrita**` y `*cursiva*`.

### Campos de la misión

| Campo | Para qué |
|---|---|
| `numero`, `titulo`, `sesion`, `caso`, `habilidad` | Datos de la tarjeta en el mapa |
| `estado` | `"disponible"` o `"proximamente"`. El panel de control manda sobre este campo. |
| `casos`, `casoActivo` | Varios casos de la misma misión; el panel de control elige cuál ven los estudiantes |
| `color` | `"naranja"`, `"magenta"` o `"verde"` |
| `historia` | 2 o 3 frases con el caso ficticio |
| `insignia` | `{ nombre, descripcion, simbolo }`. Símbolos: `lupa`, `escoba`, `regla`, `balanza`, `embudo`, `grafico`, `tablero`, `estrella` |
| `datos` | `{ titulo, columnas, filas, definiciones, aviso }`. Las definiciones y el aviso se ven siempre junto a la tabla. La primera columna debe ser el código de la fila. |
| `niveles` | `[{ numero, titulo, objetivo, cierre, actividades: [...] }]` |
| `conceptos` | `[{ termino, definicion, ejemplo }]` para «Lo que aprendimos» |
| `paraLlevar` | `{ consigna, pasos, lupa }` para la hoja imprimible |
| `teoria` | Guía «Recordemos» (ver abajo). Se puede publicar aunque la misión siga en «próximamente». |

### La guía de teoría (`teoria`)

```json
"teoria": {
  "intro": "Qué necesitas saber y por qué importa en tu vida diaria.",
  "platzi": [{ "curso": "Data1 · …", "modulo": "M1. …", "contenidos": ["…"], "relacion": "aplica | anticipa | retoma", "semanaPlatzi": 1 }],
  "ampliacion": ["Temas que se ven en vivo y no están en las clases asincrónicas"],
  "temas": [{ "id": "unidad-analisis", "titulo": "…", "idea": "…", "explicacion": "…", "cotidiano": "…", "ejemplo": "…", "enElReto": "…" }],
  "pasos": ["Cómo abordar el reto, sin resolverlo"],
  "errores": [{ "error": "…", "consejo": "…" }]
}
```

Para mostrar un tema dentro de una actividad (caja plegable «📘 Recordemos»), agrega a la actividad `"tema": "<id del tema>"`. Los ejemplos de la teoría nunca usan los datos ni las cifras del reto.

### Campos comunes de toda actividad

`id` (único en la misión), `tipo`, `fase` (`hacer`, `observar`, `entender` o `aplicar`), `titulo`, `consigna`, `explicacion` (se muestra al completar, bajo «¿Por qué?») y, opcionalmente, `pistas` (lista, se revelan de a una) y `usaDatos: true` (muestra la tabla de la misión).

### Tipos de actividad

| `tipo` | Qué hace | Campos propios |
|---|---|---|
| `leer-filas` | Tocar filas; la página las lee en lenguaje cotidiano | `minimo`, `lecturas: { "01": "texto", … }` |
| `seleccion` | Opción única con respuesta inmediata | `opciones: [{ texto, correcta?, feedback? }]`, `apoyo?` |
| `seleccion` + `multiple: true` | Casillas con botón Comprobar | `opciones: [{ texto, correcta?, feedback?, siFalta? }]` |
| `emparejar` | Para cada elemento, tocar su tipo | `tipos: [{ id, texto, ayuda? }]`, `pares: [{ item, correcto, feedback }]` |
| `completar` | Frase con espacios `{0}`, `{1}` | `frase`, `huecos: [{ opciones: [...] }]`, `textoLibre?: { etiqueta, clave }` |
| `tarjetas` | Tarjetas de a una con dos botones | `botones: { si, no }`, `tarjetas: [{ texto, respuesta: "si"/"no", explicacion }]` |
| `seleccionar-filas` | Marcar las filas que cumplen una condición | `esperadas: ["01", …]`, `feedback: { sobran, faltan }` |
| `conteo` | Contar por categoría con botones − / + | `categorias`, `esperado`, `resaltar?`, `erroresComunes: [{ valores, mensaje }]`, `mensajeGeneral` |
| `constructor` | El reto: rutas, pasos con pistas, verificación, ejemplo, copiar e imprimir | `rutas`, `pasos`, `verificacion`, `ejemplo` |
| `escritura` | Frases abiertas que van al cuaderno (no se califican) | `frases: [{ clave, inicio }]` |

`apoyo` (opcional en `seleccion`) muestra algo antes de las opciones: `{ "tipo": "comparacion", "items": [{ etiqueta, texto }] }`, `{ "tipo": "tabla", "columnas", "filas" }` o `{ "tipo": "texto", "texto" }`.

## Publicar

`make build` genera `dist/` (también lo hace la plataforma al publicar). Recomiendo **GitHub Pages**:

- Es gratis, sin límites que importen aquí, y la URL queda estable (`https://<usuario>.github.io/<repo>/`).
- Ya está configurado: `.github/workflows/pages.yml` compila y publica cada vez que haces `push` a `main`.
- Pasos: crea el repo en GitHub (público; Pages en repos privados requiere un plan pago), haz `push`, y en **Settings → Pages → Build and deployment → Source** elige **GitHub Actions**.

**Vercel** también funciona (`vercel.json` ya está listo: importa el repo y listo; da vistas previas por rama). Lo dejo como segunda opción porque su plan gratuito (Hobby) está pensado para uso personal y no comercial, y este es un recurso de un curso en el que trabajas como tutor.

En ambos casos el repositorio no contiene material de la universidad: solo los datos ficticios y textos de las misiones.

## Antes de publicar (pendiente de decidir)

- Nombre del sitio (hoy «Arcade de Datos», se cambia en `content/sitio.json`). El sitio no usa logos ni nombres de instituciones.
- Si se usará también durante la clase (proyectada) o solo como repaso.
- Contenido de las misiones 2 a 8, después de preparar cada clase.
