import Constants from 'expo-constants';

/**
 * El servidor de Trackaria, visto desde la app del profesional.
 *
 * Mismo planteamiento que en la app de clases: una función y los tipos de lo que
 * devuelve. La URL sale de `.env.local` para poder apuntar al Mac mientras se
 * desarrolla sin tocar código.
 */

const BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
  'https://fisio.trackaria.com/api/pro/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Opciones = {
  method?: 'GET' | 'POST';
  token?: string | null;
  body?: unknown;
};

export async function api<T>(ruta: string, { method = 'GET', token, body }: Opciones = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Sin conexión no hay nada que interpretar, y el mensaje del navegador no se
    // le puede enseñar a nadie.
    throw new ApiError('No hay conexión. Inténtalo otra vez en un momento.', 0);
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new ApiError((datos as { error?: string }).error || 'Algo ha fallado.', respuesta.status);
  }
  return datos as T;
}

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  centro: { id: string; nombre: string };
};

export type Resumen = {
  fecha: string;
  citas: number;
  quedan: number;
  pendientes: number;
};

export type Cita = {
  id: string;
  persona: string;
  telefono: string;
  fecha: string;
  hora: string;
  minutos: number;
  tratamiento: string;
  profesional: string;
  color: string;
  estado: string;
  origen: string;
};

export type CitaDetalle = Cita & {
  motivo: string;
  descripcion: string;
  origen_texto: string;
  creada: string;
  confirmada: string;
  /** La conversación de esa persona, si tiene. */
  chat: string;
  /** Si ese chat es del que salió la cita, y no solo el del paciente. */
  chat_del_origen: boolean;
};

export type Pendiente =
  | {
      tipo: 'conversacion';
      id: string;
      persona: string;
      telefono: string;
      motivo: string;
      motivo_texto: string;
      mensaje: string;
      desde: string;
    }
  | {
      tipo: 'cita';
      id: string;
      persona: string;
      telefono: string;
      motivo: string;
      motivo_texto: string;
      cita: Cita;
      desde: string;
    };

export type Chat = {
  id: string;
  persona: string;
  telefono: string;
  ultimo: string;
  cuando: string;
  sin_leer: number;
  /** Si lo lleva el bot ahora mismo. */
  bot: boolean;
  /** Si está esperando a alguien del centro. */
  esperando: boolean;
  motivo: string;
};

export type Mensaje = {
  id: string;
  de: 'persona' | 'bot' | 'centro';
  texto: string;
  cuando: string;
  autor: string;
};

export type DiaDeLaSemana = {
  fecha: string;
  citas: number;
  sin_confirmar: number;
};

export type HorarioDia = { dia: string; tramos: string[] };

export type Centro = {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  maps_url: string;
  horario: HorarioDia[];
  profesionales: { id: string; nombre: string; color: string; horario: HorarioDia[] }[];
  whatsapp: { conectado: boolean; numero: string; confirma_solo: boolean; bot_activo: boolean };
  calendario: { conectado: boolean; nombre: string; cuenta: string; sincroniza: boolean };
  bot: { configurado: boolean; activo?: boolean; saludo?: string; reglas?: string[] };
};

export const endpoints = {
  login: (email: string, password: string, device_name: string) =>
    api<{ token: string; usuario: Usuario }>('/auth/login/', {
      method: 'POST',
      body: { email, password, device_name },
    }),
  logout: (token: string, device_token?: string | null) =>
    api<{ ok: boolean }>('/auth/logout/', { method: 'POST', token, body: { device_token } }),
  me: (token: string) => api<{ usuario: Usuario; hoy: Resumen }>('/me/', { token }),
  pendientes: (token: string) => api<{ pendientes: Pendiente[] }>('/pendientes/', { token }),
  agenda: (token: string, fecha?: string) =>
    api<{ fecha: string; citas: Cita[]; semana: DiaDeLaSemana[] }>(
      `/agenda/${fecha ? `?fecha=${fecha}` : ''}`,
      { token },
    ),
  centro: (token: string) => api<{ centro: Centro }>('/centro/', { token }),
  carga: (token: string, desde: string, hasta: string) =>
    api<{ carga: DiaDeLaSemana[] }>(`/agenda/carga/?desde=${desde}&hasta=${hasta}`, { token }),
  chats: (token: string) => api<{ chats: Chat[] }>('/chats/', { token }),
  chat: (token: string, id: string) =>
    api<{ chat: Chat; mensajes: Mensaje[] }>(`/chats/${id}/`, { token }),
  enviar: (token: string, id: string, texto: string) =>
    api<{ mensajes: Mensaje[] }>(`/chats/${id}/enviar/`, { method: 'POST', token, body: { texto } }),
  bot: (token: string, id: string, activo: boolean) =>
    api<{ chat: Chat }>(`/chats/${id}/bot/`, { method: 'POST', token, body: { activo } }),
  cita: (token: string, id: string) => api<{ cita: CitaDetalle }>(`/citas/${id}/`, { token }),
  confirmarCita: (token: string, id: string) =>
    api<{ cita: Cita }>(`/citas/${id}/confirmar/`, { method: 'POST', token }),
};
