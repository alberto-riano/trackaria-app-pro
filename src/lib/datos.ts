import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';

type Opciones = {
  /**
   * Cada cuánto volver a preguntar mientras se está mirando la pantalla, en ms.
   *
   * Solo donde la frescura es el producto —los chats y lo que está pendiente—.
   * No hace falta que sea rápido: lo urgente llega por aviso al móvil, y esto es
   * la red por debajo para que una pantalla abierta no se quede congelada.
   */
  cada?: number;
};

/**
 * Cargar algo del servidor y mantenerlo al día.
 *
 * Tres disparadores, por orden de lo que resuelve cada uno:
 *
 * 1. **Al mirar la pantalla.** Entre que la viste y ahora puede haber cambiado
 *    todo, y esta app existe para enterarse de eso.
 * 2. **Al volver a la app.** Volver del bolsillo es volver a mirar; sin esto, lo
 *    que se ve es lo de hace una hora.
 * 3. **Al llegar un aviso.** Si suena el móvil con la app abierta, la pantalla
 *    tiene que enseñarlo ya, no cuando a alguien se le ocurra tirar de la lista.
 *
 * Y, donde se pide, un repaso cada tantos segundos como red por debajo.
 */
export function useDatos<T>(cargar: (token: string) => Promise<T>, { cada }: Opciones = {}) {
  const { token, salir } = useSession();
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [refrescando, setRefrescando] = useState(false);

  // `cargar` entra en las dependencias a propósito. Guardarlo en una ref para
  // no rehacer los temporizadores parecía más fino, pero rompía justo lo que
  // importa: al cambiar el día en la agenda, la función de carga cambia y la
  // pantalla tiene que volver a pedir **ya**, no en el siguiente repaso. Quien
  // llama ya la memoiza con sus propias dependencias, así que esto no se dispara
  // en cada render.
  const recargar = useCallback(async () => {
    if (!token) return;
    try {
      setDatos(await cargar(token));
      setError('');
    } catch (fallo) {
      // Una sesión caducada no es un error que enseñar: es volver a entrar.
      if (fallo instanceof ApiError && fallo.status === 401) {
        await salir();
        return;
      }
      setError(fallo instanceof ApiError ? fallo.message : 'No se ha podido cargar.');
    } finally {
      setRefrescando(false);
    }
  }, [token, salir, cargar]);

  // 1. Al mirar la pantalla. Y, mientras se mira, el repaso periódico.
  useFocusEffect(
    useCallback(() => {
      recargar();
      if (!cada) return;
      const reloj = setInterval(() => {
        // Con la app en segundo plano no se pregunta: gastaría batería y datos
        // para refrescar algo que nadie está mirando.
        if (AppState.currentState === 'active') recargar();
      }, cada);
      return () => clearInterval(reloj);
    }, [recargar, cada]),
  );

  // 2. Al volver a la app y 3. al llegar un aviso.
  useEffect(() => {
    if (!token) return;
    const vuelta = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') recargar();
    });
    const aviso = Notifications.addNotificationReceivedListener(() => { recargar(); });
    return () => { vuelta.remove(); aviso.remove(); };
  }, [token, recargar]);

  return {
    datos,
    error,
    refrescando,
    refrescar: () => { setRefrescando(true); recargar(); },
    recargar,
  };
}
