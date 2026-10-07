import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { PENDIENTES } from '@/lib/mock';
import { colors } from '@/lib/theme';

/**
 * Tres pestañas y ninguna más.
 *
 * «Pendiente» va la primera y es la pantalla a la que abre la app: lo único que
 * justifica mirar el móvil entre paciente y paciente es si hay algo esperando
 * una respuesta tuya. Los chats y la agenda son para consultar, y consultar
 * puede esperar.
 *
 * Todo lo que no es decidir —configuración, bot, horarios, profesionales,
 * suscripción, soporte— se queda en el panel web a propósito.
 */
export default function TabsLayout() {
  const esperando = PENDIENTES.length;

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
    </Tabs>
  );
}
