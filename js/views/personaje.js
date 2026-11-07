import { h, aviso, rotulo } from '../util.js';
import * as store from '../store.js';
import { OPCIONES, ACCESORIOS, PREDETERMINADO, spriteSVG, aleatorio } from '../components/personaje.js';

export const accesorioDesbloqueado = (id) => {
  const a = ACCESORIOS.find((x) => x.id === id);
  return !!a && (a.mision === null || store.misionCompletada(a.mision));
};

/** Datos del personaje del jugador (con valores predeterminados). */
export function miPersonaje() {
  return { ...PREDETERMINADO, ...store.personaje() };
}

/** SVG (texto) del personaje del jugador. */
export function miSprite(tam = 48, clase = '') {
  return spriteSVG(miPersonaje(), { tam, clase, desbloqueado: accesorioDesbloqueado });
}

export function nombreJugador() {
  return miPersonaje().nombre.trim() || 'Jugador 1';
}

/** Accesorio que se gana con una misión (para anunciarlo al completarla). */
export function accesorioDeMision(n) {
  return ACCESORIOS.find((a) => a.mision === n) || null;
}

export function vistaPersonaje(c) {
  const vista = h('div', { class: 'vista vista-personaje' });
  const previa = h('div', { class: 'personaje-previa', role: 'img' });
  const nombrePrevia = h('p', { class: 'personaje-previa__nombre' });

  const pintarPrevia = () => {
    const p = miPersonaje();
    previa.innerHTML = spriteSVG(p, { tam: 160, desbloqueado: accesorioDesbloqueado, clase: 'sprite--grande' });
    const describir = (g, id) => OPCIONES[g].find((o) => o.id === id)?.nombre || '';
    const acc = ACCESORIOS.find((a) => a.id === p.accesorio);
    previa.setAttribute('aria-label', `Tu personaje: ${describir('estilo', p.estilo)} ${describir('pelo', p.pelo).toLowerCase()}, piel ${describir('piel', p.piel).toLowerCase()}, camiseta ${describir('camiseta', p.camiseta).toLowerCase()}, pantalón ${describir('pantalon', p.pantalon).toLowerCase()}${acc && acc.id !== 'ninguno' && accesorioDesbloqueado(acc.id) ? `, con ${acc.nombre.toLowerCase()}` : ''}.`);
    nombrePrevia.textContent = rotulo(nombreJugador());
  };

  const grupo = (titulo, clave, opciones, conColor) => {
    const actual = miPersonaje()[clave];
    return h('fieldset', { class: 'ajuste ajuste-personaje' },
      h('legend', {}, titulo),
      h('div', { class: 'chips' }, opciones.map((o) => {
        const id = `pj-${clave}-${o.id}`;
        const input = h('input', { type: 'radio', name: `pj-${clave}`, id, value: o.id, onchange: () => { store.guardarPersonaje({ [clave]: o.id }); pintarPrevia(); } });
        if (o.id === actual) input.checked = true;
        return h('label', { class: 'chip', for: id }, input,
          h('span', {}, conColor ? h('i', { class: 'muestra-color', style: `background:${o.color}`, 'aria-hidden': 'true' }) : null, o.nombre));
      })));
  };

  const accesorios = () => {
    const actual = miPersonaje().accesorio;
    return h('fieldset', { class: 'ajuste ajuste-personaje' },
      h('legend', {}, 'Accesorio'),
      h('p', { class: 'nota' }, 'Cada insignia que ganas desbloquea un accesorio nuevo.'),
      h('div', { class: 'accesorios' }, ACCESORIOS.map((a) => {
        const libre = accesorioDesbloqueado(a.id);
        const id = `pj-acc-${a.id}`;
        const input = h('input', { type: 'radio', name: 'pj-accesorio', id, value: a.id, disabled: !libre,
          onchange: () => { store.guardarPersonaje({ accesorio: a.id }); pintarPrevia(); } });
        if (a.id === actual && libre) input.checked = true;
        const muestra = a.id === 'ninguno' ? h('span', { class: 'accesorio__icono', 'aria-hidden': 'true' }, '—')
          : h('span', { class: 'accesorio__icono', 'aria-hidden': 'true', html: libre ? spriteSVG({ ...miPersonaje(), accesorio: a.id }, { tam: 40 }) : '🔒' });
        return h('label', { class: `accesorio ${libre ? '' : 'accesorio--bloqueado'}`, for: id }, input, muestra,
          h('span', { class: 'accesorio__nombre' }, a.nombre),
          h('span', { class: 'accesorio__estado' }, libre ? (a.mision ? `Insignia M${a.mision}` : 'Libre') : `Gana la insignia de la Misión ${a.mision}`));
      })));
  };

  const campoNombre = h('input', { type: 'text', id: 'pj-nombre', class: 'campo', maxlength: '14', autocomplete: 'off', spellcheck: 'false', placeholder: 'Jugador 1' });
  campoNombre.value = miPersonaje().nombre;
  campoNombre.addEventListener('input', () => { store.guardarPersonaje({ nombre: campoNombre.value }); pintarPrevia(); });

  const opcionesEl = h('div', { class: 'personaje-opciones' });
  const pintarOpciones = () => opcionesEl.replaceChildren(
    grupo('Cabeza', 'estilo', OPCIONES.estilo, false),
    grupo('Color de pelo o gorra', 'pelo', OPCIONES.pelo, true),
    grupo('Piel', 'piel', OPCIONES.piel, true),
    grupo('Camiseta', 'camiseta', OPCIONES.camiseta, true),
    grupo('Pantalón', 'pantalon', OPCIONES.pantalon, true),
    accesorios());

  const sorprender = h('button', { type: 'button', class: 'btn', onclick: () => {
    store.guardarPersonaje(aleatorio(ACCESORIOS.filter((a) => accesorioDesbloqueado(a.id))));
    pintarPrevia(); pintarOpciones();
    aviso('¡Personaje nuevo!');
  } }, '🎲 Sorpréndeme');

  const reiniciar = h('button', { type: 'button', class: 'btn', onclick: () => {
    store.guardarPersonaje({ ...PREDETERMINADO, nombre: campoNombre.value });
    pintarPrevia(); pintarOpciones();
  } }, '↺ Volver al original');

  pintarPrevia();
  pintarOpciones();

  vista.append(
    h('h1', { tabindex: '-1' }, 'Mi personaje'),
    h('p', {}, 'Este es quien recorre el mapa por ti. Arréglalo a tu gusto: puedes cambiarlo cuando quieras.'),
    h('div', { class: 'personaje-escenario' }, previa, nombrePrevia),
    h('div', { class: 'acciones acciones--envolver acciones--centro' }, sorprender, reiniciar),
    h('div', { class: 'ajuste' },
      h('label', { for: 'pj-nombre', class: 'etiqueta' }, 'Nombre de jugador (opcional)'),
      campoNombre,
      h('p', { class: 'nota' }, 'Puede ser un apodo. No hace falta tu nombre real: solo se ve en este dispositivo.')),
    opcionesEl,
    h('p', { class: 'nota' }, 'Tu personaje se guarda solo en este navegador, como el resto de tu progreso.'),
    h('p', {}, h('a', { class: 'btn btn--primario', href: '#/' }, '🗺 Ir al mapa')));
  return vista;
}
