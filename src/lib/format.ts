/** Fechas y horas en castellano, sin traerse una librería para cuatro cosas. */

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function mayuscula(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Una fecha como `2026-10-07`, en local y sin que el huso la mueva un día. */
export function enIso(fecha: Date) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Una fecha `2026-10-07` como objeto, sin que el huso la mueva un día. */
export function comoFecha(iso: string) {
  return new Date(`${iso}T00:00:00`);
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

/** Los minutos que lleva esperando, para decidir si ya es tarde. */
export function minutosDesde(iso: string) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
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

/** Sumar días a una fecha en ISO, sin tocar husos. */
export function sumarDias(iso: string, dias: number) {
  const fecha = comoFecha(iso);
  fecha.setDate(fecha.getDate() + dias);
  return enIso(fecha);
}

/** El lunes de la semana en la que cae ese día. */
export function lunesDe(iso: string) {
  const fecha = comoFecha(iso);
  return sumarDias(iso, -((fecha.getDay() + 6) % 7));
}

const MESES_LARGOS = MESES;

/** «Octubre de 2026», para la cabecera del calendario. */
export function tituloDeMes(iso: string) {
  const fecha = comoFecha(iso);
  return mayuscula(`${MESES_LARGOS[fecha.getMonth()]} de ${fecha.getFullYear()}`);
}

/** El día 1 de ese mes. */
export function inicioDeMes(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

export function moverMes(iso: string, meses: number) {
  const fecha = comoFecha(inicioDeMes(iso));
  fecha.setMonth(fecha.getMonth() + meses);
  return enIso(fecha);
}

/** Las semanas de un mes, de lunes a domingo, con los días de al lado incluidos. */
export function semanasDelMes(iso: string) {
  const primero = inicioDeMes(iso);
  const ultimo = enIso(new Date(comoFecha(primero).getFullYear(), comoFecha(primero).getMonth() + 1, 0));
  const semanas: string[][] = [];
  let lunes = lunesDe(primero);
  while (lunes <= ultimo) {
    const desde = lunes;
    semanas.push(Array.from({ length: 7 }, (_, salto) => sumarDias(desde, salto)));
    lunes = sumarDias(lunes, 7);
  }
  return semanas;
}

/** Si ese día cae en el mes de la referencia. */
export function mismoMes(iso: string, referencia: string) {
  return iso.slice(0, 7) === referencia.slice(0, 7);
}
