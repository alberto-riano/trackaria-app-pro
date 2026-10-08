import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { api } from '@/lib/api';

const CLAVE = 'trackaria.pro.push';

// Con la app abierta el aviso también se enseña: quien está mirando la agenda
// tiene que enterarse igual de que alguien acaba de pedir hablar con una persona.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function proyecto(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Expo Go no recibe push: solo la app compilada con EAS. */
export function hayPush() {
  return (
    Device.isDevice &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
    !!proyecto()
  );
}

/** Pide permiso y apunta este móvil. Sin push la app sigue funcionando igual. */
export async function registrarMovil(token: string) {
  if (!hayPush()) return;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Avisos de tu centro',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return;
    const { data: clave } = await Notifications.getExpoPushTokenAsync({ projectId: proyecto() });
    await api('/devices/', { method: 'POST', token, body: { token: clave, platform: Platform.OS } });
    await SecureStore.setItemAsync(CLAVE, clave);
  } catch {
    // Sin avisos se sigue viendo todo entrando en la app; no es motivo para no entrar.
  }
}

/** La clave de este móvil, para decirle al servidor que deje de avisarle. */
export async function claveDelMovil() {
  try {
    return await SecureStore.getItemAsync(CLAVE);
  } catch {
    return null;
  }
}

export async function olvidarMovil() {
  try {
    await SecureStore.deleteItemAsync(CLAVE);
  } catch {
    // Si no se puede borrar, Expo lo dará por caducado cuando falle el envío.
  }
}
