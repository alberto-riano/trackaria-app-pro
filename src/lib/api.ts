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
  'https://app.trackaria.com/api/pro/v1';

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
  centro: {
    id: string;
    nombre: string;
    /** Qué pestañas tiene sentido enseñar en este centro. */
    clases: boolean;
    citas: boolean;
    bonos: boolean;
    mensualidades?: boolean;
    /**
     * Si el centro tiene WhatsApp conectado.
     *
     * Opcional porque puede faltar: un servidor sin desplegar todavía no lo
     * manda, y entonces se da por bueno que sí. Quitar pestañas por un campo
     * que no ha llegado sería peor que enseñarlas de más.
     */
    whatsapp?: boolean;
  };
};

export type Resumen = {
  fecha: string;
  citas: number;
  quedan: number;
  pendientes: number;
  /** Conversaciones con algo sin leer. Puede faltar si el servidor es anterior. */
  chats_sin_leer?: number;
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
      /** La conversación de la que salió, para ir a hablarlo antes de decidir. */
      chat: string;
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

/** Un día en la tira de semanas: cuánto hay y si algo pide atención. */
export type DiaConCarga = {
  fecha: string;
  cuantas: number;
  aviso?: boolean;
};

export type Clase = {
  id: string;
  nombre: string;
  color: string;
  icono: string;
  imagen: string;
  fecha: string;
  hora: string;
  fin: string;
  minutos: number;
  sala: string;
  instructor: string;
  plazas: number;
  ocupadas: number;
  libres: number;
  cancelada: boolean;
  motivo: string;
  empezada: boolean;
};

export type Apuntado = {
  id: string;
  cliente: string;
  nombre: string;
  telefono: string;
  /** Con qué entró: el nombre del bono, «Mensualidad» o «Clase a favor». */
  paga: string;
  /** Si tiene la plaza fija por su mensualidad. */
  fijo: boolean;
  estado: string;
};

/** Lo que queda por hacer después de cancelar una clase. */
export type ResumenDeCancelar = {
  afectados: number;
  en_espera: number;
  avisados: number;
  /** A quién hay que llamar, porque no tiene la app y no se va a enterar. */
  por_llamar: { id: string; nombre: string; telefono: string }[];
  a_bono: number;
  a_favor: number;
};

export type ClaseDetalle = Clase & {
  apuntados: Apuntado[];
  espera: { id: string; nombre: string; ofrecida: boolean }[];
  /** Si quitar a alguien ahora le devuelve la clase, según la regla del centro. */
  devuelve: boolean;
  /** Si esta cuenta puede cancelar la clase. Lo decide el servidor, no el rol. */
  puede_cancelar?: boolean;
  /** Si toca pasar lista: el día de la clase o después, y sin cancelar. */
  lista?: boolean;
  vinieron?: number;
  /** Cuántos siguen sin marcar. «No se sabe» no es «no vino». */
  sin_marcar?: number;
};

export type Bono = {
  id: string;
  nombre: string;
  quedan: number;
  total: number;
  /** La clase a la que se limita, si va limitado. */
  clase: string;
};

export type Favor = { id: string; nombre: string; quedan: number };

export type AlumnoBuscado = {
  id: string;
  nombre: string;
  telefono: string;
  apuntado: boolean;
  /** Solo cuando se busca con una clase delante. */
  bonos?: Bono[];
  favores?: Favor[];
};

/** Una clase suya: a la que viene, o a la que vino. */
export type ClaseSuya = {
  id: string;
  nombre: string;
  fecha: string;
  hora: string;
  /** Solo en las pasadas. `null` es «nadie pasó lista», no «faltó». */
  vino?: boolean | null;
};

export type Alumno = {
  id: string;
  nombre: string;
  telefono: string;
  bonos: Bono[];
  mensualidades: { id: string; desde: string; hasta: string; favores: number }[];
  proximas: ClaseSuya[];
  ultimas?: ClaseSuya[];
};

/** Una clase de las que da el centro, para atarle un bono. */
export type TipoDeClase = { id: string; nombre: string; color: string };

/** A quién puede ir un aviso: a todos o a los alumnos de una clase. */
export type ParaQuien = {
  clave: string;
  nombre: string;
  /** Debajo del nombre: «Todos sus horarios», el instructor… */
  detalle: string;
  color: string;
  imagen: string;
  /** Cuántos horarios tiene. Con uno solo no hay nada que afinar. */
  horarios: number;
  personas: number;
};

/** Un horario suelto de una clase: «lun y mié · 19:00». */
export type HorarioDeAviso = { clave: string; nombre: string; detalle: string; personas: number };

export type AvisoEnviado = {
  id: string;
  titulo: string;
  texto: string;
  para: string;
  personas: number;
  cuando: string;
};

export type HorarioSuyo = {
  id: string;
  /**
   * La clase concreta a la que lleva esta fila, o vacío si no hay ninguna.
   *
   * `id` es el del horario semanal y no se puede abrir: «todos los martes» no
   * es un día. Esto es la primera que viene, que es a la que se quiere entrar
   * mirando el cuadrante.
   */
  proxima?: string;
  nombre: string;
  color: string;
  imagen?: string;
  hora: string;
  sala: string;
};

export type Instructor = {
  id: string;
  nombre: string;
  color: string;
  telefono: string;
  semana: { dia: string; clases: HorarioSuyo[] }[];
  hoy: Clase[];
};

/** Un horario fijo al que se puede apuntar a alguien como alumno fijo. */
export type Grupo = {
  id: string;
  nombre: string;
  color: string;
  imagen?: string;
  dia: string;
  hora: string;
  sala: string;
  instructor: string;
};

export type CargaDeClases = { fecha: string; clases: number; completas: number };

export type HorarioDia = { dia: string; tramos: string[] };

export type Centro = {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  maps_url: string;
  horario: HorarioDia[];
  profesionales: { id: string; nombre: string; color: string; horario: HorarioDia[] }[];
  /** Quién da las clases. Otra gente y otra tabla que los profesionales. */
  instructores?: { id: string; nombre: string; color: string; clases: string[] }[];
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
  chats: (token: string, busca = '') =>
    api<{ chats: Chat[] }>(`/chats/${busca ? `?q=${encodeURIComponent(busca)}` : ''}`, { token }),
  chat: (token: string, id: string) =>
    api<{ chat: Chat; mensajes: Mensaje[] }>(`/chats/${id}/`, { token }),
  enviar: (token: string, id: string, texto: string) =>
    api<{ mensajes: Mensaje[] }>(`/chats/${id}/enviar/`, { method: 'POST', token, body: { texto } }),
  bot: (token: string, id: string, activo: boolean) =>
    api<{ chat: Chat }>(`/chats/${id}/bot/`, { method: 'POST', token, body: { activo } }),
  cita: (token: string, id: string) => api<{ cita: CitaDetalle }>(`/citas/${id}/`, { token }),
  confirmarCita: (token: string, id: string) =>
    api<{ cita: Cita; avisado: boolean }>(`/citas/${id}/confirmar/`, { method: 'POST', token }),

  rechazarCita: (token: string, id: string) =>
    api<{ cita: Cita; avisado: boolean }>(`/citas/${id}/rechazar/`, { method: 'POST', token }),

  // Las clases en grupo. Apuntar y quitar; los horarios siguen en el panel.
  clases: (token: string, fecha?: string) =>
    api<{ fecha: string; clases: Clase[]; semana: CargaDeClases[] }>(
      `/clases/${fecha ? `?fecha=${fecha}` : ''}`,
      { token },
    ),
  cargaDeClases: (token: string, desde: string, hasta: string) =>
    api<{ carga: CargaDeClases[] }>(`/clases/carga/?desde=${desde}&hasta=${hasta}`, { token }),
  clase: (token: string, id: string) => api<{ clase: ClaseDetalle }>(`/clases/${id}/`, { token }),
  apuntar: (token: string, id: string, cliente: string, pago?: { bono?: string; mensualidad?: string }) =>
    api<{ clase: ClaseDetalle }>(`/clases/${id}/apuntar/`, {
      method: 'POST',
      token,
      body: { cliente, ...pago },
    }),
  quitar: (token: string, id: string, reserva: string, devolver?: boolean) =>
    api<{ clase: ClaseDetalle }>(`/clases/${id}/quitar/`, {
      method: 'POST',
      token,
      body: { reserva, ...(devolver === undefined ? {} : { devolver }) },
    }),
  alumnos: (token: string, busca = '', clase = '') =>
    api<{ alumnos: AlumnoBuscado[] }>(
      `/alumnos/?q=${encodeURIComponent(busca)}${clase ? `&clase=${clase}` : ''}`,
      { token },
    ),
  alumno: (token: string, id: string) => api<{ alumno: Alumno }>(`/alumnos/${id}/`, { token }),
  darBono: (token: string, id: string, clases: number, nombre = '', clase = '') =>
    api<{ bono: Bono; alumno: Alumno }>(`/alumnos/${id}/bonos/`, {
      method: 'POST',
      token,
      body: { clases, nombre, ...(clase ? { clase } : {}) },
    }),
  ajustarBono: (token: string, id: string, clases: number, motivo: string) =>
    api<{ bono: Bono; alumno: Alumno }>(`/bonos/${id}/ajustar/`, {
      method: 'POST',
      token,
      body: { clases, motivo },
    }),
  desactivarBono: (token: string, id: string) =>
    api<{ alumno: Alumno }>(`/bonos/${id}/desactivar/`, { method: 'POST', token }),
  grupos: (token: string) => api<{ grupos: Grupo[] }>('/clases/grupos/', { token }),
  apuntarAGrupos: (token: string, id: string, grupos: string[]) =>
    api<{ alumno: Alumno; reservadas: number; llenas: number }>(`/alumnos/${id}/mensualidad/`, {
      method: 'POST',
      token,
      body: { grupos },
    }),
  tiposDeClase: (token: string) => api<{ tipos: TipoDeClase[] }>('/clases/tipos/', { token }),
  instructor: (token: string, id: string) =>
    api<{ instructor: Instructor }>(`/instructores/${id}/`, { token }),
  avisos: (token: string) =>
    api<{ opciones: ParaQuien[]; avisos: AvisoEnviado[] }>('/avisos/', { token }),
  // Cuántos lo recibirían, para poder decirlo antes de enviarlo: «son 18, pero
  // solo 12 tienen la app».
  horariosDeAviso: (token: string, clase: string) =>
    api<{
      clase: { id: string; nombre: string; color: string; imagen: string };
      horarios: HorarioDeAviso[];
    }>(`/avisos/horarios/?clase=${clase}`, { token }),
  destinatarios: (token: string, para: string) =>
    api<{ etiqueta: string; personas: number; con_app: number }>(
      `/avisos/?para=${encodeURIComponent(para)}`,
      { token },
    ),
  enviarAviso: (token: string, para: string, titulo: string, texto: string) =>
    api<{ personas: number; avisos: AvisoEnviado[] }>('/avisos/', {
      method: 'POST',
      token,
      body: { para, titulo, texto },
    }),
  // Uno suelto, o de una vez los que faltaban por marcar.
  pasarLista: (
    token: string,
    id: string,
    que: { reserva: string; vino: boolean } | { vinieron_todos: true },
  ) => api<{ clase: ClaseDetalle }>(`/clases/${id}/lista/`, { method: 'POST', token, body: que }),
  cancelarClase: (token: string, id: string, motivo: string) =>
    api<{ clase: ClaseDetalle; resumen: ResumenDeCancelar }>(`/clases/${id}/cancelar/`, {
      method: 'POST',
      token,
      body: { motivo },
    }),
  avisarAClase: (token: string, id: string, texto: string) =>
    api<{ personas: number }>(`/clases/${id}/avisar/`, { method: 'POST', token, body: { texto } }),
  // `ya_estaba` no es un error: ese teléfono ya tenía ficha y es a ella a donde
  // quería llegar quien está preguntando.
  crearAlumno: (token: string, nombre: string, telefono: string) =>
    api<{ alumno: Alumno; ya_estaba: boolean }>('/alumnos/', {
      method: 'POST',
      token,
      body: { nombre, telefono },
    }),
};
