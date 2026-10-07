import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, Encabezado } from '@/components/ui';
import { dayTitle, hora } from '@/lib/format';
import { AGENDA, CENTRO, type Cita } from '@/lib/mock';
import { colors, radius, space } from '@/lib/theme';

/**
 * El día, para consultar.
 *
 * Aquí no se crea ni se mueve nada: mover una cita toca el calendario de Google,
 * avisa al paciente y puede chocar con otra. Eso se hace en el panel, con sitio
 * para ver las consecuencias. Esto es «¿quién viene ahora?».
 */
export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const ahora = new Date();
  const sinConfirmar = AGENDA.filter((cita) => cita.estado === 'sin-confirmar').length;
  const siguiente = AGENDA.find((cita) => cita.inicio > ahora);

  return (
    <ScrollView
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + space.lg }]}
      showsVerticalScrollIndicator={false}>
      <Encabezado titulo={dayTitle(ahora)} coletilla={CENTRO} />

      <View style={styles.resumen}>
        <Text style={styles.resumenTexto}>
          {AGENDA.length} citas
          {sinConfirmar > 0 ? ` · ${sinConfirmar} sin confirmar` : ''}
        </Text>
        {siguiente ? (
          <Text style={styles.siguiente}>
            La siguiente, {hora(siguiente.inicio)} · {siguiente.persona}
          </Text>
        ) : (
          <Text style={styles.siguiente}>No queda nada por hoy.</Text>
        )}
      </View>

      <View style={styles.lista}>
        {AGENDA.map((cita) => (
          <Fila key={cita.id} cita={cita} pasada={cita.inicio < ahora} />
        ))}
      </View>
    </ScrollView>
  );
}

function Fila({ cita, pasada }: { cita: Cita; pasada: boolean }) {
  return (
    <View style={[styles.fila, pasada && styles.filaPasada]}>
      {/* La hora fuera de la tarjeta, alineada: así la columna de horas se lee
          sola de arriba abajo y se ve de un vistazo dónde están los huecos. */}
      <View style={styles.columnaHora}>
        <Text style={[styles.hora, pasada && styles.textoPasado]}>{hora(cita.inicio)}</Text>
        <Text style={styles.duracion}>{cita.minutos}′</Text>
      </View>

      <View style={styles.tarjeta}>
        <View style={[styles.franja, { backgroundColor: cita.color }]} />
        <View style={styles.texto}>
          <Text style={[styles.persona, pasada && styles.textoPasado]} numberOfLines={1}>
            {cita.persona}
          </Text>
          <Text style={styles.detalle} numberOfLines={1}>
            {cita.tratamiento} · {cita.profesional}
          </Text>
          {cita.estado === 'sin-confirmar' ? (
            <View style={styles.chips}>
              <Chip label="Sin confirmar" tone="warning" />
            </View>
          ) : null}
        </View>
        {pasada ? <Ionicons name="checkmark" size={18} color={colors.faint} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, paddingBottom: space.xxl },
  resumen: { marginBottom: space.lg, gap: 2 },
  resumenTexto: { fontSize: 16, fontWeight: '700', color: colors.text },
  siguiente: { fontSize: 14, color: colors.muted },
  lista: { gap: space.sm },
  fila: { flexDirection: 'row', gap: space.md, alignItems: 'stretch' },
  filaPasada: { opacity: 0.55 },
  columnaHora: { width: 52, paddingTop: space.md, alignItems: 'flex-end' },
  hora: { fontSize: 15, fontWeight: '800', color: colors.text },
  duracion: { fontSize: 11, color: colors.faint },
  textoPasado: { color: colors.muted },
  tarjeta: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: space.md, paddingLeft: 0, overflow: 'hidden',
  },
  franja: { width: 4, alignSelf: 'stretch', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  texto: { flex: 1, gap: 2 },
  persona: { fontSize: 16, fontWeight: '700', color: colors.text },
  detalle: { fontSize: 13, color: colors.muted },
  chips: { flexDirection: 'row', marginTop: space.xs },
});
