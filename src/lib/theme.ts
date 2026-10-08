/**
 * Los mismos colores que la app de clases y que la web: es la misma marca y el
 * mismo dueño de centro quien ve las dos cosas.
 *
 * Lo que cambia aquí es el peso: esta app se usa de pie, entre paciente y
 * paciente, mirando si hay algo que decidir. Así que la jerarquía la marcan el
 * ámbar de «esto te espera» y el verde de «esto ya está».
 */
export const colors = {
  brand: '#08766c',
  brandDark: '#065f57',
  brandSoft: '#e3f5f0',
  text: '#111827',
  muted: '#6b7280',
  faint: '#9ca3af',
  border: '#e5e7eb',
  surface: '#ffffff',
  background: '#f6f8f7',
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

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
