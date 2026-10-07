import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';

/**
 * Cargar algo del servidor cada vez que se mira la pantalla.
 *
 * Al volver a una pestaña hay que recargar: entre que la miraste y ahora puede
 * haber entrado un mensaje o haberse confirmado una cita, y esta app existe
 * precisamente para enterarse de eso. Por eso `useFocusEffect` y no `useEffect`.
 */
export function useDatos<T>(cargar: (token: string) => Promise<T>) {
  const { token, salir } = useSession();
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [refrescando, setRefrescando] = useState(false);

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
  }, [token, cargar, salir]);

  useFocusEffect(useCallback(() => { recargar(); }, [recargar]));

  return {
    datos,
    error,
    refrescando,
    refrescar: () => { setRefrescando(true); recargar(); },
    recargar,
  };
}
