import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.brand,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}>
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
      </Stack>
    </>
  );
}
