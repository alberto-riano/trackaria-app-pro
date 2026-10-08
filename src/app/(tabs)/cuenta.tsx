import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback } from 'react';
import {
  ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Encabezado } from '@/components/ui';
import { endpoints, type Centro, type HorarioDia } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * El centro y tu cuenta.
 *
 * Todo esto es **de lectura**, y es a propósito: cambiar el horario de alguien
 * mueve la disponibilidad que el bot ofrece por WhatsApp, y eso se decide en el
 * panel viendo las consecuencias, no de pie entre dos pacientes. Aquí se viene a
 * mirar «¿quién trabaja el jueves por la tarde?», que es la pregunta que te hace
 * un paciente delante.
 */
export default function CuentaScreen() {
  const insets = useSafeAreaInsets();
  const { usuario, salir } = useSession();
  const { datos, error, refrescando, refrescar } = useDatos(
    useCallback((token: string) => endpoints.centro(token), []),
  );

  const centro = datos?.centro ?? null;

  return (
    <ScrollView
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + space.lg }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.brand} />}>
      <Encabezado titulo={usuario?.centro.nombre ?? 'Tu centro'} coletilla="Trackaria Pro" />

      {error ? (
        <View style={styles.error} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorTexto}>{error}</Text>
        </View>
      ) : null}

      {centro === null ? (
        <ActivityIndicator color={colors.brand} style={styles.cargando} />
      ) : (
        <>
          <Card style={styles.bloqueCaja}>
            {centro.direccion ? (
              <Dato icono="location-outline" texto={centro.direccion} />
            ) : null}
            {centro.telefono ? <Dato icono="call-outline" texto={centro.telefono} /> : null}
            <Horario dias={centro.horario} vacio="Sin horario guardado." />
            {centro.maps_url ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL(centro.maps_url)}
                style={({ pressed }) => [styles.enlace, pressed && { opacity: 0.7 }]}>
                <Ionicons name="navigate-outline" size={16} color={colors.brandDark} />
                <Text style={styles.enlaceTexto}>Cómo llegar</Text>
              </Pressable>
            ) : null}
          </Card>

          <Bloque titulo={centro.profesionales.length === 1 ? 'Profesional' : 'Profesionales'}>
            {centro.profesionales.length === 0 ? (
              <Text style={styles.vacio}>Todavía no hay profesionales dados de alta.</Text>
            ) : (
              centro.profesionales.map((profesional) => (
                <View key={profesional.id} style={styles.profesional}>
                  <View style={[styles.punto, { backgroundColor: profesional.color || colors.brand }]} />
                  <View style={styles.profesionalTexto}>
                    <Text style={styles.profesionalNombre}>{profesional.nombre}</Text>
                    <Horario dias={profesional.horario} vacio="Sigue el horario del centro." />
                  </View>
                </View>
              ))
            )}
          </Bloque>

          {/* Lo que trabaja solo por detrás. Es lo que explica por qué pasan
              cosas sin que nadie las haga, y lo que nadie recuerda si dejó
              conectado. */}
          <Bloque titulo="Conectado">
            <Conexion
              icono="logo-whatsapp"
              color="#25D366"
              titulo="WhatsApp Business"
              activo={centro.whatsapp.conectado}
              detalle={
                centro.whatsapp.conectado
                  ? centro.whatsapp.numero
                  : 'Ningún número conectado.'
              }
              nota={
                centro.whatsapp.conectado
                  ? centro.whatsapp.bot_activo
                    ? centro.whatsapp.confirma_solo
                      ? 'El bot contesta y las citas que reserva quedan confirmadas.'
                      : 'El bot contesta y sus citas te esperan en «Pendiente».'
                    : 'El bot está apagado: contestáis vosotros.'
                  : ''
              }
            />
            <View style={styles.separador} />
            <Conexion
              icono="calendar"
              color="#4285F4"
              titulo="Google Calendar"
              activo={centro.calendario.conectado}
              detalle={
                centro.calendario.conectado
                  ? centro.calendario.nombre || centro.calendario.cuenta || 'Agenda sincronizada'
                  : 'Sin conectar.'
              }
              nota={
                centro.calendario.conectado && !centro.calendario.sincroniza
                  ? 'La sincronización está pausada.'
                  : ''
              }
            />
          </Bloque>
        </>
      )}

      <View style={styles.panel}>
        <Ionicons name="desktop-outline" size={18} color={colors.muted} />
        <Text style={styles.panelTexto}>
          Los horarios, el bot y las conexiones se cambian desde el panel de Trackaria, en el
          ordenador. Aquí solo se consulta.
        </Text>
      </View>

      <View style={styles.pie}>
        <Text style={styles.quien}>{usuario?.nombre}</Text>
        {usuario && usuario.nombre !== usuario.email ? (
          <Text style={styles.correo}>{usuario.email}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={salir}
          style={({ pressed }) => [styles.salir, pressed && { opacity: 0.7 }]}>
          <Text style={styles.salirTexto}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.bloque}>
      <Text style={styles.bloqueTitulo}>{titulo.toUpperCase()}</Text>
      <Card style={styles.bloqueCaja}>{children}</Card>
    </View>
  );
}

function Dato({ icono, texto }: { icono: 'location-outline' | 'call-outline'; texto: string }) {
  return (
    <View style={styles.dato}>
      <Ionicons name={icono} size={16} color={colors.faint} />
      <Text style={styles.datoTexto}>{texto}</Text>
    </View>
  );
}

function Conexion({
  icono, color, titulo, activo, detalle, nota,
}: {
  icono: 'logo-whatsapp' | 'calendar';
  color: string;
  titulo: string;
  activo: boolean;
  detalle: string;
  nota: string;
}) {
  return (
    <View style={styles.conexion}>
      <View style={[styles.conexionIcono, !activo && styles.conexionApagada]}>
        <Ionicons name={icono} size={20} color={activo ? color : colors.faint} />
      </View>
      <View style={styles.conexionTexto}>
        <View style={styles.conexionLinea}>
          <Text style={styles.conexionTitulo}>{titulo}</Text>
          <View style={[styles.estado, { backgroundColor: activo ? colors.successSoft : '#f3f4f6' }]}>
            <Text style={[styles.estadoTexto, { color: activo ? colors.success : colors.muted }]}>
              {activo ? 'Conectado' : 'Sin conectar'}
            </Text>
          </View>
        </View>
        <Text style={styles.conexionDetalle}>{detalle}</Text>
        {nota ? <Text style={styles.conexionNota}>{nota}</Text> : null}
      </View>
    </View>
  );
}

/** La semana de alguien. Solo los días que trabaja: los cerrados no se mandan. */
function Horario({ dias, vacio }: { dias: HorarioDia[]; vacio: string }) {
  if (dias.length === 0) return <Text style={styles.vacio}>{vacio}</Text>;
  return (
    <View style={styles.horario}>
      {dias.map((dia) => (
        <View key={dia.dia} style={styles.horarioFila}>
          <Text style={styles.horarioDia}>{dia.dia}</Text>
          <Text style={styles.horarioTramos}>{dia.tramos.join(' · ')}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, paddingBottom: space.xxl, gap: space.lg },
  cargando: { marginVertical: space.xl },
  bloque: { gap: space.sm },
  bloqueTitulo: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: colors.faint, paddingHorizontal: space.xs },
  bloqueCaja: { gap: space.sm },
  dato: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  datoTexto: { flex: 1, fontSize: 15, color: colors.muted },
  vacio: { fontSize: 14, color: colors.faint, fontStyle: 'italic' },
  horario: { gap: 3, marginTop: space.xs },
  horarioFila: { flexDirection: 'row', gap: space.sm },
  horarioDia: { width: 82, fontSize: 14, fontWeight: '700', color: colors.text },
  horarioTramos: { flex: 1, fontSize: 14, color: colors.muted },
  profesional: { flexDirection: 'row', gap: space.md, paddingVertical: space.xs },
  punto: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  profesionalTexto: { flex: 1, gap: 2 },
  profesionalNombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  conexion: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  conexionIcono: {
    width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  conexionApagada: { opacity: 0.6 },
  conexionTexto: { flex: 1, gap: 2 },
  conexionLinea: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  conexionTitulo: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  estado: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  estadoTexto: { fontSize: 11, fontWeight: '800' },
  conexionDetalle: { fontSize: 14, color: colors.muted },
  conexionNota: { fontSize: 13, color: colors.faint, lineHeight: 18, marginTop: 1 },
  separador: { height: 1, backgroundColor: colors.border, marginVertical: space.xs },
  enlace: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    minHeight: 40, borderRadius: radius.md, backgroundColor: colors.brandSoft, marginTop: space.xs,
  },
  enlaceTexto: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
  panel: {
    flexDirection: 'row', gap: space.md, alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: space.lg,
  },
  panelTexto: { flex: 1, fontSize: 14, color: colors.muted, lineHeight: 20 },
  pie: { alignItems: 'center', gap: space.xs },
  quien: { fontSize: 14, fontWeight: '700', color: colors.muted },
  correo: { fontSize: 12, color: colors.faint },
  salir: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.lg, marginTop: space.xs },
  salirTexto: { fontSize: 15, fontWeight: '700', color: colors.danger },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
