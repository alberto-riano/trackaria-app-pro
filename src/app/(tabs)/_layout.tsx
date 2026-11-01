import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useCallback } from 'react';

import { endpoints } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { useSession } from '@/lib/session';
import { colors } from '@/lib/theme';

/**
 * Las pestañas, según lo que haga el centro.
 *
 * «Pendiente» va la primera y es la pantalla a la que abre la app: lo único que
 * justifica mirar el móvil entre paciente y paciente es si hay algo esperando
 * una respuesta tuya. Chats, agenda, clases y cuenta son para consultar, y
 * consultar puede esperar.
 *
 * La misma app la usan dos negocios que no se parecen: una clínica con agenda y
 * bot de WhatsApp, y un estudio que solo da clases. Ninguno de los dos debería
 * notar que la app sirve también para el otro, así que aquí no hay pestañas
 * apagadas: la que no aplica no existe.
 *
 * «Pendiente» y «Chats» necesitan WhatsApp. Sin canal no hay bot, no hay
 * conversaciones y no puede haber nada pendiente **nunca**: no es que hoy esté
 * vacío, es que no va a dejar de estarlo. Un estudio de clases abre la app
 * directamente en Clases.
 *
 * «Agenda» y «Clases» salen solo si el centro las usa. Un estudio de pilates no
 * tiene consulta y una clínica de fisio puede no dar clases: enseñar una
 * pestaña que siempre está vacía es hacer dudar de si falta algo por
 * configurar.
 *
 * «Cuenta» enseña el centro —profesionales, horarios, servicios— **en lectura**:
 * cambiar cualquiera de esas cosas mueve lo que el bot ofrece por WhatsApp, y
 * eso se decide en el panel. Lo mismo la configuración, la suscripción y el
 * soporte, que no están aquí a propósito.
 *
 * Dentro de «Clases» sí se apunta y se quita gente: es lo que se hace con
 * alguien delante preguntando, y lo único que no puede esperar al ordenador.
 */
export default function TabsLayout() {
  // El número va en la pestaña para no tener que entrar a mirar si hay algo.
  const { datos } = useDatos(useCallback((token: string) => endpoints.me(token), []));
  const esperando = datos?.hoy.pendientes ?? 0;

  // Qué pestañas hay se decide con la sesión y no con esa carga: la sesión ya
  // trae el centro comprobado desde el arranque, así que salen bien de
  // primeras. Sacándolo de la carga, se verían aparecer y desaparecer.
  const { usuario } = useSession();
  const centro = usuario?.centro;
  // Mientras no se sabe, se enseña la agenda: es lo que tiene la mayoría, y
  // esconder las dos deja la app con dos pestañas durante un parpadeo.
  const hayCitas = centro ? centro.citas : true;
  const hayClases = centro ? centro.clases : false;
  // Un servidor que todavía no manda el campo no debe hacer desaparecer nada.
  const hayWhatsapp = centro ? centro.whatsapp !== false : true;

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
          href: hayWhatsapp ? undefined : null,
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
          href: hayWhatsapp ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          href: hayCitas ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="clases"
        options={{
          title: 'Clases',
          href: hayClases ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} color={color} size={size} />
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
