import * as SecureStore from 'expo-secure-store';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ApiError, endpoints, type Usuario } from '@/lib/api';

/**
 * Quién está dentro y su centro.
 *
 * La clave vive en el llavero del móvil, no en memoria: quien abre esto lo abre
 * veinte veces al día entre paciente y paciente y no va a escribir su contraseña
 * cada vez.
 */

const CLAVE = 'trackaria.pro.token';

type Valor = {
  token: string | null;
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (email: string, password: string) => Promise<void>;
  salir: () => Promise<void>;
};

const Contexto = createContext<Valor | null>(null);

export function useSession() {
  const valor = use(Contexto);
  if (!valor) throw new Error('useSession tiene que usarse dentro de SessionProvider');
  return valor;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const guardado = await SecureStore.getItemAsync(CLAVE);
        if (guardado) {
          // Se comprueba contra el servidor antes de dar por buena la sesión: una
          // clave revocada desde el panel no debe dejar entrar a nadie.
          const { usuario: quien } = await endpoints.me(guardado);
          setToken(guardado);
          setUsuario(quien);
        }
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await SecureStore.deleteItemAsync(CLAVE).catch(() => {});
        }
        // Si fue un fallo de red, no se borra nada: el token sigue valiendo y lo
        // que toca es volver a intentarlo, no echar a nadie.
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const entrar = useCallback(async (email: string, password: string) => {
    const { token: clave, usuario: quien } = await endpoints.login(email, password, 'Trackaria Pro');
    await SecureStore.setItemAsync(CLAVE, clave).catch(() => {});
    setToken(clave);
    setUsuario(quien);
  }, []);

  const salir = useCallback(async () => {
    const clave = token;
    setToken(null);
    setUsuario(null);
    await SecureStore.deleteItemAsync(CLAVE).catch(() => {});
    // Se avisa al servidor después de cerrar por aquí: si la llamada falla, la
    // sesión ya está fuera de este móvil, que es lo que ha pedido quien la cierra.
    if (clave) await endpoints.logout(clave).catch(() => {});
  }, [token]);

  const valor = useMemo(
    () => ({ token, usuario, cargando, entrar, salir }),
    [token, usuario, cargando, entrar, salir],
  );

  return <Contexto value={valor}>{children}</Contexto>;
}
