import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useSession } from '@/lib/session';
import { colors } from '@/lib/theme';

/**
 * Al tocar un aviso se abre aquello de lo que habla.
 *
 * Un aviso que te deja en la pantalla de inicio te obliga a buscar tú lo que
 * acababa de contarte, que es justo lo que venía a ahorrarte.
 */
function AvisosTocados() {
  const { token } = useSession();
  const respuesta = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!token || !respuesta) return;
    if (respuesta.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const datos = respuesta.notification.request.content.data as { conversacion?: string };
    if (datos?.conversacion) {
      router.push(`/chat/${datos.conversacion}`);
    } else {
      // Una cita por confirmar se resuelve desde «Pendiente», con su botón.
      router.push('/');
    }
    Notifications.clearLastNotificationResponseAsync();
  }, [respuesta, token]);

  return null;
}

function RootNavigator() {
  const { token, cargando } = useSession();

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <>
    <AvisosTocados />
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.brand,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}>
      {/* Sin sesión solo existe la pantalla de entrar. Así no hay forma de llegar
          por accidente a una pantalla que pediría datos del centro sin tenerlos. */}
      <Stack.Protected guard={!token}>
        <Stack.Screen name="entrar" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="chat/[id]"
          options={{
            title: '',
            // Se entra aquí desde «Pendiente» y desde «Chats», así que poner el
            // nombre de la pantalla anterior mentiría la mitad de las veces.
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
      </Stack.Protected>
    </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
