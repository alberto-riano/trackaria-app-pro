/**
 * Datos de mentira para ir montando las pantallas.
 *
 * Todavía no hay API para esta app: el panel de Trackaria es Django renderizado
 * en servidor y no expone nada para el profesional. Cuando la haya, esto se
 * sustituye por `src/lib/api.ts` y las pantallas no deberían cambiar, que para
 * eso los tipos de aquí son los que queremos pedirle al servidor.
 *
 * Los nombres y teléfonos son inventados a propósito: aquí no entran datos de
 * pacientes reales ni de pruebas.
 */

export type Pendiente =
  | {
      tipo: 'cita';
      id: string;
      persona: string;
      telefono: string;
      /** Lo que ha pedido, ya resuelto por el bot contra la agenda. */
      cuando: Date;
      tratamiento: string;
      profesional: string;
      /** Si el hueco sigue libre. Si no, hay que proponer otra cosa. */
      hueco: boolean;
      desde: Date;
    }
  | {
      tipo: 'agente';
      id: string;
      persona: string;
      telefono: string;
      /** Por qué el bot se ha apartado: lo último que dijo esa persona. */
      mensaje: string;
      desde: Date;
    };

export type Conversacion = {
  id: string;
  persona: string;
  telefono: string;
  ultimo: string;
  cuando: Date;
  sinLeer: number;
  /** Si el bot sigue al mando. En falso, la llevas tú. */
  bot: boolean;
  /** La persona ha pedido hablar con alguien: es lo que pinta el aviso. */
  esperando: boolean;
};

export type Mensaje = {
  id: string;
  de: 'persona' | 'bot' | 'yo';
  texto: string;
  cuando: Date;
};

export type Cita = {
  id: string;
  persona: string;
  tratamiento: string;
  profesional: string;
  color: string;
  inicio: Date;
  minutos: number;
  estado: 'confirmada' | 'sin-confirmar';
};

function haceMinutos(minutos: number) {
  return new Date(Date.now() - minutos * 60_000);
}

function hoyA(hora: number, minuto = 0) {
  const fecha = new Date();
  fecha.setHours(hora, minuto, 0, 0);
  return fecha;
}

export const CENTRO = 'Fisioterapia Alameda';

export const PENDIENTES: Pendiente[] = [
  {
    tipo: 'agente',
    id: 'p1',
    persona: 'Carlos Sanz',
    telefono: '+34 600 00 00 03',
    mensaje: 'Quiero hablar con Marta, es sobre el parte de la mutua.',
    desde: haceMinutos(4),
  },
  {
    tipo: 'cita',
    id: 'p2',
    persona: 'Paula Herrera',
    telefono: '+34 600 00 00 01',
    cuando: hoyA(18, 30),
    tratamiento: 'Fisioterapia · 45 min',
    profesional: 'Marta',
    hueco: true,
    desde: haceMinutos(12),
  },
  {
    tipo: 'cita',
    id: 'p3',
    persona: 'Óscar Benítez',
    telefono: '+34 600 00 00 04',
    cuando: hoyA(10, 0),
    tratamiento: 'Punción seca · 30 min',
    profesional: 'Marta',
    hueco: false,
    desde: haceMinutos(55),
  },
];

export const CONVERSACIONES: Conversacion[] = [
  {
    id: 'c1',
    persona: 'Carlos Sanz',
    telefono: '+34 600 00 00 03',
    ultimo: 'Quiero hablar con Marta, es sobre el parte de la mutua.',
    cuando: haceMinutos(4),
    sinLeer: 2,
    bot: false,
    esperando: true,
  },
  {
    id: 'c2',
    persona: 'Paula Herrera',
    telefono: '+34 600 00 00 01',
    ultimo: 'Perfecto, entonces el jueves a las 18:30. ¡Gracias!',
    cuando: haceMinutos(12),
    sinLeer: 0,
    bot: true,
    esperando: false,
  },
  {
    id: 'c3',
    persona: 'Alberto Ruiz',
    telefono: '+34 600 00 00 02',
    ultimo: 'Te he apuntado el martes 14 a las 09:00 con Marta.',
    cuando: haceMinutos(90),
    sinLeer: 0,
    bot: true,
    esperando: false,
  },
  {
    id: 'c4',
    persona: 'Óscar Benítez',
    telefono: '+34 600 00 00 04',
    ultimo: '¿Y no tenéis nada más temprano esa semana?',
    cuando: haceMinutos(55),
    sinLeer: 1,
    bot: true,
    esperando: false,
  },
];

export const MENSAJES: Record<string, Mensaje[]> = {
  c1: [
    { id: 'm1', de: 'persona', texto: 'Buenas, ¿me podéis mandar el justificante de la sesión del lunes?', cuando: haceMinutos(9) },
    { id: 'm2', de: 'bot', texto: 'Claro. Te lo puedo enviar por aquí en cuanto lo prepare el centro. ¿Lo necesitas para la mutua?', cuando: haceMinutos(8) },
    { id: 'm3', de: 'persona', texto: 'Sí, pero es un lío porque me lo han rechazado dos veces.', cuando: haceMinutos(5) },
    { id: 'm4', de: 'persona', texto: 'Quiero hablar con Marta, es sobre el parte de la mutua.', cuando: haceMinutos(4) },
  ],
  c2: [
    { id: 'm1', de: 'persona', texto: 'Hola, necesitaría cita esta semana por la tarde si puede ser', cuando: haceMinutos(20) },
    { id: 'm2', de: 'bot', texto: 'Tengo libre el jueves a las 18:30 con Marta, 45 minutos. ¿Te va bien?', cuando: haceMinutos(18) },
    { id: 'm3', de: 'persona', texto: 'Perfecto, entonces el jueves a las 18:30. ¡Gracias!', cuando: haceMinutos(12) },
  ],
  c3: [
    { id: 'm1', de: 'persona', texto: 'Buenos días, ¿tenéis hueco la semana que viene?', cuando: haceMinutos(120) },
    { id: 'm2', de: 'bot', texto: 'Te he apuntado el martes 14 a las 09:00 con Marta.', cuando: haceMinutos(90) },
  ],
  c4: [
    { id: 'm1', de: 'bot', texto: 'Para esa semana lo primero que tengo es el viernes a las 12:00.', cuando: haceMinutos(60) },
    { id: 'm2', de: 'persona', texto: '¿Y no tenéis nada más temprano esa semana?', cuando: haceMinutos(55) },
  ],
};

export const AGENDA: Cita[] = [
  { id: 'a1', persona: 'Lucía Prats', tratamiento: 'Fisioterapia', profesional: 'Marta', color: '#08766c', inicio: hoyA(9, 0), minutos: 45, estado: 'confirmada' },
  { id: 'a2', persona: 'Óscar Benítez', tratamiento: 'Punción seca', profesional: 'Marta', color: '#08766c', inicio: hoyA(10, 0), minutos: 30, estado: 'confirmada' },
  { id: 'a3', persona: 'Nuria Vela', tratamiento: 'Primera visita', profesional: 'Dani', color: '#b45309', inicio: hoyA(11, 30), minutos: 60, estado: 'sin-confirmar' },
  { id: 'a4', persona: 'Alberto Ruiz', tratamiento: 'Fisioterapia', profesional: 'Dani', color: '#b45309', inicio: hoyA(16, 0), minutos: 45, estado: 'confirmada' },
  { id: 'a5', persona: 'Paula Herrera', tratamiento: 'Fisioterapia', profesional: 'Marta', color: '#08766c', inicio: hoyA(18, 30), minutos: 45, estado: 'sin-confirmar' },
];
