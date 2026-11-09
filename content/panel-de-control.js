// ╔══════════════════════════════════════════════════════════════════╗
// ║                     PANEL DE CONTROL DEL TUTOR                     ║
// ╚══════════════════════════════════════════════════════════════════╝
//
// Este es el ÚNICO archivo que necesitas tocar antes de cada clase.
//
//   abierta:  true  → los estudiantes pueden jugar la misión
//             false → la ven bloqueada («Próximamente»), con la teoría disponible
//             (también sirve escribir 'si' / 'no' o 'on' / 'off')
//
//   caso:     'cotidiano' → el caso de la vida diaria (ver Planeación/General/03_Casos_alternativos.md)
//             'guia'      → el caso de la guía oficial de la sesión
//             'ambos'     → los dos casos en la misma misión, para practicar más.
//                           La insignia se gana terminando cualquiera de los dos.
//
// Después de cambiar algo: guarda, haz commit y push. GitHub Pages publica solo en 1-2 minutos.
// Para revisar una misión bloqueada antes de abrirla: abre el sitio con ?previa
//   (por ejemplo https://astorress.github.io/arcade-de-datos/?previa)
// y cambia de caso con los botones de la parte de arriba de cada misión.

export default {
  1: { abierta: true, caso: 'ambos' }, // Leer la fila y preguntar bien
  2: { abierta: false, caso: 'ambos' }, // Limpieza
  3: { abierta: false, caso: 'ambos' }, // Media, mediana y extremos
  4: { abierta: false, caso: 'ambos' }, // Tasas con denominador
  5: { abierta: false, caso: 'ambos' }, // Filtros y agrupar
  6: { abierta: false, caso: 'ambos' }, // Gráficos
  7: { abierta: false, caso: 'ambos' }, // Tablero
  8: { abierta: false, caso: 'ambos' }, // Caso integral
}
