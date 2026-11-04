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
 * «Alumnos» acompaña a «Clases» porque media conversación del mostrador empieza
 * por una persona y no por una clase: «¿me queda bono?» no se contesta mejor
 * acordándose antes de a qué clase viene.
 *
 * Dentro de «Clases» sí se apunta y se quita gente, y dentro de «Alumnos» se da
 * de alta y se venden bonos: es lo que se hace con alguien delante preguntando,
 * y lo único que no puede esperar al panel.
 */
export default function TabsLayout() {
  // Los números van en las pestañas para no tener que entrar a mirar si hay algo.
  // Se repasa cada medio minuto: un globito que solo se actualiza al cambiar
  // de pestaña dice que no hay nada nuevo cuando sí lo hay, y el globito es
  // justo lo que se mira sin entrar.
  const { datos } = useDatos(
    useCallback((token: string) => endpoints.me(token), []),
    { cada: 30_000 },
  );
  const esperando = datos?.hoy.pendientes ?? 0;
  // Chats sin leer: son conversaciones, no mensajes. Lo que se decide mirando
  // el globito es «¿tengo que entrar?», y tres mensajes de la misma persona
  // siguen siendo una sola visita.
  const sinLeer = datos?.hoy.chats_sin_leer ?? 0;

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

  // Un centro que lo tiene todo llega a seis pestañas, y a seis la palabra más
  // larga —«Pendiente»— se corta en «Pendie…». Antes que esconderle una
  // pestaña a ese centro, la letra baja un punto: siguen leyéndose enteras.
  const pestanas = 2 + (hayWhatsapp ? 2 : 0) + (hayCitas ? 1 : 0) + (hayClases ? 1 : 0);
  const letra = pestanas >= 6 ? 10 : 11;

  // La barra se rehace entera cuando cambia la forma del centro.
  //
  // Una pestaña que no aplica se quita con `href: null`, y el navegador de
  // nativo se queda con la lista de rutas que tenía: al cerrar sesión en un
  // estudio de solo clases y entrar en un centro que lo tiene todo, alguna de
  // las que volvían a tocar no reaparecía hasta cerrar la app del todo. Con una
  // llave por forma, el navegador se monta de nuevo y la lista sale limpia.
  //
  // No cuesta nada: esto solo cambia al entrar o al salir, que es cuando la app
  // va a empezar por la primera pestaña de todas formas.
  const forma = `${hayWhatsapp}-${hayCitas}-${hayClases}`;

  return (
    <Tabs
      key={forma}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontSize: letra, fontWeight: '600' },
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
          tabBarBadge: sinLeer > 0 ? sinLeer : undefined,
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
          // Una figura en movimiento, no un grupo de gente: el grupo de gente
          // es «Alumnos», y de dos en dos en la misma barra no se distinguían.
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'body' : 'body-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="alumnos"
        options={{
          title: 'Alumnos',
          // Donde hay clases hay alumnos. En una clínica de consulta la gente
          // son pacientes y se llevan desde la agenda, así que aquí no cabe.
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
