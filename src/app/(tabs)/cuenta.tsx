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
 * Tu cuenta y la ficha del centro.
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
      <Encabezado titulo="Tu cuenta" coletilla={usuario?.centro.nombre} />

      <Card style={styles.ficha}>
        <View style={styles.iconoCuenta}>
          <Ionicons name="person" size={24} color={colors.brand} />
        </View>
        <Text style={styles.nombre}>{usuario?.nombre}</Text>
        {/* Una cuenta sin nombre cae en su correo, y entonces repetirlo debajo
            es enseñar lo mismo dos veces. */}
        {usuario && usuario.nombre !== usuario.email ? (
          <Text style={styles.email}>{usuario.email}</Text>
        ) : null}
      </Card>

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
          <Bloque titulo="Tu centro">
            <Text style={styles.centroNombre}>{centro.nombre}</Text>
            {centro.direccion ? <Text style={styles.dato}>{centro.direccion}</Text> : null}
            {centro.telefono ? <Text style={styles.dato}>{centro.telefono}</Text> : null}
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
          </Bloque>

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

          {centro.servicios.length > 0 ? (
            <Bloque titulo="Servicios">
              {centro.servicios.map((servicio) => (
                <View key={servicio.id} style={styles.servicio}>
                  <View style={[styles.punto, { backgroundColor: servicio.color || colors.brand }]} />
                  <Text style={styles.servicioNombre}>{servicio.nombre}</Text>
                  <Text style={styles.servicioMinutos}>{servicio.minutos} min</Text>
                </View>
              ))}
            </Bloque>
          ) : null}

          <Bloque titulo="WhatsApp">
            <View style={styles.bot}>
              <Ionicons
                name={centro.bot.conectado ? 'desktop' : 'alert-circle-outline'}
                size={18}
                color={centro.bot.conectado ? colors.bot : colors.warning}
              />
              <Text style={styles.dato}>
                {centro.bot.conectado
                  ? `El bot atiende en ${centro.bot.numero}`
                  : 'Todavía no hay ningún número conectado.'}
              </Text>
            </View>
            {centro.bot.conectado ? (
              <Text style={styles.nota}>
                {centro.bot.confirma_solo
                  ? 'Las citas que reserva quedan confirmadas sin pasar por ti.'
                  : 'Las citas que reserva te esperan en «Pendiente» hasta que las confirmes.'}
              </Text>
            ) : null}
          </Bloque>
        </>
      )}

      <View style={styles.panel}>
        <Ionicons name="desktop-outline" size={18} color={colors.muted} />
        <Text style={styles.panelTexto}>
          Todo esto se cambia desde el panel de Trackaria, en el ordenador. Aquí solo se consulta.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={salir}
        style={({ pressed }) => [styles.salir, pressed && { opacity: 0.7 }]}>
        <Text style={styles.salirTexto}>Cerrar sesión</Text>
      </Pressable>
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
  ficha: { alignItems: 'center', gap: 2 },
  iconoCuenta: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: space.sm,
  },
  nombre: { fontSize: 19, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.muted },
  bloque: { gap: space.sm },
  bloqueTitulo: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: colors.faint, paddingHorizontal: space.xs },
  bloqueCaja: { gap: space.sm },
  centroNombre: { fontSize: 17, fontWeight: '800', color: colors.text },
  dato: { fontSize: 15, color: colors.muted, lineHeight: 21 },
  vacio: { fontSize: 14, color: colors.faint, fontStyle: 'italic' },
  horario: { gap: 3, marginTop: space.xs },
  horarioFila: { flexDirection: 'row', gap: space.sm },
  horarioDia: { width: 82, fontSize: 14, fontWeight: '700', color: colors.text },
  horarioTramos: { flex: 1, fontSize: 14, color: colors.muted },
  profesional: { flexDirection: 'row', gap: space.md, paddingVertical: space.xs },
  punto: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  profesionalTexto: { flex: 1, gap: 2 },
  profesionalNombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  servicio: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  servicioNombre: { flex: 1, fontSize: 15, color: colors.text },
  servicioMinutos: { fontSize: 13, color: colors.faint, fontWeight: '600' },
  bot: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  nota: { fontSize: 13, color: colors.faint, lineHeight: 19 },
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
  salir: {
    minHeight: 50, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  salirTexto: { fontSize: 16, fontWeight: '700', color: colors.danger },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
