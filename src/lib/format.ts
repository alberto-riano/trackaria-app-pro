/** Fechas y horas en castellano, sin traerse una librería para cuatro cosas. */

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function mayuscula(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** «Hoy», «Mañana» o «Martes 14 de octubre». */
export function dayTitle(fecha: Date) {
  const hoy = new Date();
  const dia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = Math.round((dia.getTime() - base.getTime()) / 86_400_000);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  if (dias === -1) return 'Ayer';
  return mayuscula(`${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`);
}

export function hora(fecha: Date) {
  return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/**
 * «hace 4 min». Lo que importa en esta app no es la hora exacta a la que
 * escribieron, es cuánto lleva esperando esa persona.
 */
export function timeAgo(fecha: Date) {
  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60_000);
  if (minutos < 1) return 'ahora mismo';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} días`;
}

/** Las iniciales para el círculo del avatar: «Paula Gil» -> «PG». */
export function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}
