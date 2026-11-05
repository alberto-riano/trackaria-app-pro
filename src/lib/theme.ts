import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';

/**
 * Los mismos colores que la app de clases y que la web: es la misma marca y el
 * mismo dueño de centro quien ve las dos cosas.
 *
 * Lo que cambia aquí es el peso: esta app se usa de pie, entre paciente y
 * paciente, mirando si hay algo que decidir. Así que la jerarquía la marcan el
 * ámbar de «esto te espera» y el verde de «esto ya está».
 */

/**
 * El fondo, que se puede cambiar desde Cuenta.
 *
 * El crema es el del icono y hace que las tarjetas blancas se vean como
 * tarjetas: sobre el gris, que es casi blanco, no tienen borde ni sombra ni
 * contraste y flotan. El gris es el que compartía con la app de clientes y la
 * web.
 *
 * Se lee de forma síncrona al arrancar y no con un contexto porque los estilos
 * se construyen al cargar cada módulo, antes de que React pinte nada: un valor
 * que llega después no llegaría a ninguna hoja de estilos. Por eso cambiarlo
 * reinicia la app, que es lo que hace `cambiarFondo`.
 */
export const FONDOS = {
  crema: '#f4efe3',
  gris: '#f6f8f7',
} as const;

export type Fondo = keyof typeof FONDOS;

function guardado(): Fondo {
  // En el primer arranque, o si el llavero falla, el crema: es el que lleva la
  // marca y el que deja ver las tarjetas.
  try {
    return SecureStore.getItem('fondo') === 'gris' ? 'gris' : 'crema';
  } catch {
    return 'crema';
  }
}

export const fondo: Fondo = guardado();

export const colors = {
  brand: '#08766c',
  brandDark: '#065f57',
  brandSoft: '#e3f5f0',
  text: '#111827',
  muted: '#6b7280',
  faint: '#9ca3af',
  border: '#e5e7eb',
  surface: '#ffffff',
  background: FONDOS[fondo],
  // El verde de WhatsApp, para el botón que abre WhatsApp y para nada más.
  whatsapp: '#25d366',
  success: '#15803d',
  successSoft: '#dcfce7',
  warning: '#b45309',
  warningSoft: '#fffbeb',
  danger: '#dc2626',
  dangerSoft: '#fef2f2',
  // El bot. Morado para que no se confunda nunca con un mensaje tuyo ni del
  // paciente: de un vistazo tienes que saber quién ha escrito eso.
  bot: '#6d28d9',
  botSoft: '#f5f3ff',
  // Y los dos de las insignias, que van rellenos. Pálidos se confundían con el
  // círculo de las iniciales, que es justo lo que tenían que distinguir.
  botFuerte: '#7c3aed',
  centroFuerte: '#0f766e',
} as const;

/**
 * Guarda el fondo y reinicia la app para que se aplique.
 *
 * Reiniciar no es pereza: las hojas de estilo se construyen una vez, al cargar
 * cada módulo, así que no hay forma de que un cambio posterior llegue a todas.
 * El reinicio es inmediato y la sesión no se pierde —está en el llavero—, así
 * que se nota menos que la pantalla a medio repintar que saldría si no.
 */
export async function cambiarFondo(nuevo: Fondo) {
  SecureStore.setItem('fondo', nuevo);
  await Updates.reloadAsync();
}

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
