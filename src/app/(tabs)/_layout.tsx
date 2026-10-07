import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useCallback } from 'react';

import { endpoints } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { colors } from '@/lib/theme';

/**
 * Cuatro pestañas y ninguna más.
 *
 * «Pendiente» va la primera y es la pantalla a la que abre la app: lo único que
 * justifica mirar el móvil entre paciente y paciente es si hay algo esperando
 * una respuesta tuya. Chats, agenda y cuenta son para consultar, y consultar
 * puede esperar.
 *
 * «Cuenta» enseña el centro —profesionales, horarios, servicios— **en lectura**:
 * cambiar cualquiera de esas cosas mueve lo que el bot ofrece por WhatsApp, y
 * eso se decide en el panel. Lo mismo la configuración, la suscripción y el
 * soporte, que no están aquí a propósito.
 */
export default function TabsLayout() {
  // El número va en la pestaña para no tener que entrar a mirar si hay algo.
  const { datos } = useDatos(useCallback((token: string) => endpoints.me(token), []));
  const esperando = datos?.hoy.pendientes ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.surface },
        tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: 11, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pendiente',
          tabBarBadge: esperando > 0 ? esperando : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cuenta"
        options={{
          title: 'Cuenta',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
