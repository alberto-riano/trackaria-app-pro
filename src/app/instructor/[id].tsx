import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Insignia, Plazas } from '@/components/clase-ui';
import { Avatar, Card, Chip } from '@/components/ui';
import { endpoints, type Instructor } from '@/lib/api';
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
                  <Text style={styles.deHoyHora} numberOfLines={1}>{clase.hora}</Text>
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

          <Bloque titulo="Su semana" coletilla={comoSeReparte(instructor.semana)}>
            {instructor.semana.length === 0 ? (
              <Text style={styles.vacio}>
                No tiene ninguna clase fija. Los horarios se ponen en el panel de Trackaria.
              </Text>
            ) : (
              instructor.semana.map((dia, orden) => (
                <View key={dia.dia} style={[styles.dia, orden > 0 && styles.diaSeparado]}>
                  <Text style={styles.diaNombre}>{dia.dia.toUpperCase()}</Text>
                  {dia.clases.map((clase) => (
                    // El cuadrante se mira para acabar entrando en una: «el
                    // martes que viene, ¿cuántos hay apuntados?». La fila lleva
                    // a la primera que viene de ese horario. Cuando no hay
                    // ninguna —todo el mes cerrado, por ejemplo— no es pulsable
                    // en vez de llevar a una pantalla vacía.
                    <Pressable
                      key={clase.id}
                      accessibilityRole={clase.proxima ? 'button' : undefined}
                      accessibilityLabel={clase.proxima
                        ? `Abrir la próxima clase de ${clase.nombre}`
                        : undefined}
                      disabled={!clase.proxima}
                      onPress={() => router.push(`/clase/${clase.proxima}`)}
                      style={({ pressed }) => [styles.deLaSemana, pressed && { opacity: 0.7 }]}>
                      <Text style={styles.semanaHora} numberOfLines={1}>{clase.hora}</Text>
                      <Insignia
                        nombre={clase.nombre}
                        color={clase.color}
                        imagen={clase.imagen}
                        tamano={32}
                      />
                      {/* El nombre en su línea y la sala debajo: antes iban los
                          dos en una sola, y un nombre largo se comía la sala. */}
                      <View style={styles.semanaTexto}>
                        <Text style={styles.semanaNombre} numberOfLines={2}>{clase.nombre}</Text>
                        {clase.sala ? (
                          <Text style={styles.semanaSala} numberOfLines={1}>{clase.sala}</Text>
                        ) : null}
                      </View>
                      {clase.proxima ? (
                        <Ionicons name="chevron-forward" size={16} color={colors.faint} />
                      ) : null}
                    </Pressable>
                  ))}
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

/** Cuánto trabaja, en una línea: es lo que se mira antes de pedirle un cambio. */
function comoSeReparte(semana: Instructor['semana']) {
  const clases = semana.reduce((suma, dia) => suma + dia.clases.length, 0);
  if (clases === 0) return '';
  const cuantas = clases === 1 ? '1 clase' : `${clases} clases`;
  const dias = semana.length === 1 ? '1 día' : `${semana.length} días`;
  return `${cuantas} en ${dias}`;
}

function Bloque({
  titulo, coletilla, children,
}: {
  titulo: string;
  coletilla?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.bloque}>
      <View style={styles.bloqueCabecera}>
        <Text style={styles.bloqueTitulo}>{titulo.toUpperCase()}</Text>
        {coletilla ? <Text style={styles.bloqueColetilla}>{coletilla}</Text> : null}
      </View>
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
  bloqueCabecera: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    gap: space.sm, paddingHorizontal: space.xs,
  },
  bloqueTitulo: {
    fontSize: 13, fontWeight: '800', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  bloqueColetilla: { fontSize: 13, color: colors.faint, fontWeight: '600' },
  bloqueCard: { paddingVertical: space.sm },
  vacio: { fontSize: 14, color: colors.muted, lineHeight: 21, paddingVertical: space.sm },
  deHoy: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  // Ancho mínimo y no fijo: con el tamaño de letra grande del sistema, «12:00»
  // no cabía en 48 puntos y se partía en «12:0 / 0».
  deHoyHora: { minWidth: 48, flexShrink: 0, fontSize: 15, fontWeight: '800', color: colors.text },
  deHoyTexto: { flex: 1, gap: 3 },
  filaTitulo: { fontSize: 16, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row' },
  dia: { paddingVertical: space.sm },
  diaSeparado: { borderTopWidth: 1, borderTopColor: colors.border },
  diaNombre: {
    fontSize: 12, fontWeight: '800', color: colors.faint,
    letterSpacing: 0.5, marginBottom: space.xs,
  },
  deLaSemana: {
    flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs,
  },
  semanaHora: { minWidth: 48, flexShrink: 0, fontSize: 15, fontWeight: '800', color: colors.text },
  semanaTexto: { flex: 1, minWidth: 0, gap: 2 },
  semanaNombre: { fontSize: 15, fontWeight: '600', color: colors.text, lineHeight: 20 },
  semanaSala: { fontSize: 13, color: colors.muted },
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
