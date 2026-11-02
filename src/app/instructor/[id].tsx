import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Insignia, Plazas } from '@/components/clase-ui';
import { Avatar, Card, Chip } from '@/components/ui';
import { endpoints } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { colors, radius, space } from '@/lib/theme';

/**
 * Quién da las clases: su semana y lo que da hoy.
 *
 * Son dos cosas distintas a propósito. La semana es el cuadrante, lo que está
 * previsto. Lo de hoy sale de las clases de verdad, así que recoge las
 * sustituciones y las cancelaciones, que es justo lo que no aparece en un
 * cuadrante y lo que preguntan cuando llaman.
 *
 * Y su teléfono, que es por lo que se entra aquí la mitad de las veces: alguien
 * no puede venir y hay que llamarle ya.
 */
export default function InstructorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { datos, error } = useDatos(
    useCallback((token: string) => endpoints.instructor(token, id), [id]),
  );

  const instructor = datos?.instructor ?? null;

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Stack.Screen options={{ title: 'Instructor', headerBackButtonDisplayMode: 'minimal' }} />

      {error ? (
        <View style={styles.error} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorTexto}>{error}</Text>
        </View>
      ) : null}

      {instructor === null ? (
        <ActivityIndicator color={colors.brand} style={styles.cargando} />
      ) : (
        <>
          <Card style={styles.cabecera}>
            <Avatar nombre={instructor.nombre} />
            <Text style={styles.nombre}>{instructor.nombre}</Text>
            {instructor.telefono ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Llamar a ${instructor.nombre}`}
                onPress={() => Linking.openURL(`tel:${instructor.telefono}`)}
                style={({ pressed }) => [styles.telefono, pressed && { opacity: 0.7 }]}>
                <Ionicons name="call-outline" size={15} color={colors.brandDark} />
                <Text style={styles.telefonoTexto}>{instructor.telefono}</Text>
              </Pressable>
            ) : (
              <Text style={styles.sinTelefono}>Sin teléfono guardado</Text>
            )}
          </Card>

          {instructor.hoy.length > 0 ? (
            <Bloque titulo="Hoy da">
              {instructor.hoy.map((clase) => (
                <Pressable
                  key={clase.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${clase.hora}, ${clase.nombre}`}
                  onPress={() => router.push(`/clase/${clase.id}`)}
                  style={({ pressed }) => [styles.deHoy, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.deHoyHora}>{clase.hora}</Text>
                  <Insignia nombre={clase.nombre} color={clase.color} imagen={clase.imagen} tamano={36} />
                  <View style={styles.deHoyTexto}>
                    <Text style={styles.filaTitulo} numberOfLines={1}>{clase.nombre}</Text>
                    {clase.cancelada ? (
                      <View style={styles.chips}><Chip label="Cancelada" tone="danger" /></View>
                    ) : (
                      <Plazas ocupadas={clase.ocupadas} plazas={clase.plazas} />
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.faint} />
                </Pressable>
              ))}
            </Bloque>
          ) : null}

          <Bloque titulo="Su semana">
            {instructor.semana.length === 0 ? (
              <Text style={styles.vacio}>
                No tiene ninguna clase fija. Los horarios se ponen en el panel de Trackaria.
              </Text>
            ) : (
              instructor.semana.map((dia) => (
                <View key={dia.dia} style={styles.dia}>
                  <Text style={styles.diaNombre}>{dia.dia}</Text>
                  <View style={styles.diaClases}>
                    {dia.clases.map((clase) => (
                      <View key={clase.id} style={styles.deLaSemana}>
                        <View style={[styles.punto, { backgroundColor: clase.color || colors.brand }]} />
                        <Text style={styles.semanaHora}>{clase.hora}</Text>
                        <Text style={styles.semanaNombre} numberOfLines={1}>
                          {clase.nombre}
                          {clase.sala ? <Text style={styles.semanaSala}>{`  ·  ${clase.sala}`}</Text> : null}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </Bloque>

          <View style={styles.panel}>
            <Ionicons name="desktop-outline" size={18} color={colors.muted} />
            <Text style={styles.panelTexto}>
              Sus datos y sus horarios se cambian desde el panel de Trackaria, en la versión web.
              Aquí solo se consulta.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.bloque}>
      <Text style={styles.bloqueTitulo}>{titulo.toUpperCase()}</Text>
      <Card style={styles.bloqueCard}>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, paddingBottom: space.xxl, gap: space.lg },
  cargando: { marginTop: space.xxl },
  cabecera: { alignItems: 'center', gap: space.xs },
  nombre: {
    fontSize: 22, fontWeight: '800', color: colors.text,
    marginTop: space.sm, letterSpacing: -0.3, textAlign: 'center',
  },
  telefono: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingVertical: space.xs },
  telefonoTexto: { fontSize: 15, fontWeight: '700', color: colors.brandDark },
  sinTelefono: { fontSize: 14, color: colors.faint, paddingVertical: space.xs },
  bloque: { gap: space.sm },
  bloqueTitulo: {
    fontSize: 13, fontWeight: '800', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: space.xs,
  },
  bloqueCard: { paddingVertical: space.sm },
  vacio: { fontSize: 14, color: colors.muted, lineHeight: 21, paddingVertical: space.sm },
  deHoy: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  deHoyHora: { width: 48, fontSize: 15, fontWeight: '800', color: colors.text },
  deHoyTexto: { flex: 1, gap: 3 },
  filaTitulo: { fontSize: 16, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row' },
  dia: { paddingVertical: space.sm, gap: space.xs },
  diaNombre: {
    fontSize: 13, fontWeight: '800', color: colors.faint, letterSpacing: 0.2,
  },
  diaClases: { gap: space.xs },
  deLaSemana: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  punto: { width: 8, height: 8, borderRadius: 4 },
  semanaHora: { width: 48, fontSize: 15, fontWeight: '700', color: colors.text },
  semanaNombre: { flex: 1, fontSize: 15, color: colors.text },
  semanaSala: { color: colors.muted },
  panel: {
    flexDirection: 'row', gap: space.sm, alignItems: 'flex-start',
    backgroundColor: colors.background, borderRadius: radius.md, padding: space.md,
  },
  panelTexto: { flex: 1, fontSize: 13, color: colors.muted, lineHeight: 19 },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
