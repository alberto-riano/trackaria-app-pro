import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, space } from '@/lib/theme';
import { iniciales } from '@/lib/format';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand' | 'bot' }) {
  const paleta = {
    neutral: { fondo: '#f3f4f6', texto: colors.muted },
    success: { fondo: colors.successSoft, texto: colors.success },
    warning: { fondo: colors.warningSoft, texto: colors.warning },
    danger: { fondo: colors.dangerSoft, texto: colors.danger },
    brand: { fondo: colors.brandSoft, texto: colors.brandDark },
    bot: { fondo: colors.botSoft, texto: colors.bot },
  }[tone];
  return (
    <View style={[styles.chip, { backgroundColor: paleta.fondo }]}>
      <Text style={[styles.chipTexto, { color: paleta.texto }]}>{label}</Text>
    </View>
  );
}

/**
 * El círculo con las iniciales. Sin fotos: por aquí pasan datos de pacientes.
 *
 * `insignia` cuelga debajo, donde iría el punto de estado de cualquier chat.
 * Ahí va quién lleva la conversación, que es el dato propio de esta app.
 */
export function Avatar({
  nombre, tono = 'neutral', insignia,
}: {
  nombre: string;
  tono?: 'neutral' | 'alerta';
  insignia?: React.ReactNode;
}) {
  return (
    <View style={styles.avatarCaja}>
      <View style={[styles.avatar, tono === 'alerta' && styles.avatarAlerta]}>
        <Text style={[styles.avatarTexto, tono === 'alerta' && { color: colors.warning }]}>{iniciales(nombre)}</Text>
      </View>
      {insignia ? <View style={styles.insignia}>{insignia}</View> : null}
    </View>
  );
}

type BotonProps = {
  titulo: string;
  onPress: () => void;
  variante?: 'principal' | 'secundario' | 'suave';
  style?: StyleProp<ViewStyle>;
};

export function Boton({ titulo, onPress, variante = 'principal', style }: BotonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.boton, styles[variante], pressed && { opacity: 0.75 }, style]}>
      <Text style={[styles.botonTexto, variante === 'principal' ? styles.botonTextoClaro : styles.botonTextoOscuro]}>
        {titulo}
      </Text>
    </Pressable>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <View style={styles.vacio}>
      <Text style={styles.vacioTitulo}>{title}</Text>
      {text ? <Text style={styles.vacioTexto}>{text}</Text> : null}
    </View>
  );
}

/** El título de cada pantalla, con el centro encima en pequeño. */
export function Encabezado({
  titulo, coletilla, accion,
}: {
  titulo: string;
  coletilla?: string;
  accion?: React.ReactNode;
}) {
  return (
    <View style={styles.encabezadoFila}>
      <View style={styles.encabezado}>
        {coletilla ? <Text style={styles.coletilla}>{coletilla}</Text> : null}
        <Text style={styles.titulo}>{titulo}</Text>
      </View>
      {accion}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chip: { paddingHorizontal: space.sm + 2, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  chipTexto: { fontSize: 12, fontWeight: '700' },
  avatarCaja: { alignItems: 'center' },
  insignia: {
    position: 'absolute', bottom: -7, alignSelf: 'center',
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center',
  },
  avatarAlerta: { backgroundColor: colors.warningSoft },
  avatarTexto: { fontSize: 15, fontWeight: '800', color: colors.brandDark },
  boton: { minHeight: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  principal: { backgroundColor: colors.brand },
  secundario: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  suave: { backgroundColor: colors.brandSoft },
  botonTexto: { fontSize: 15, fontWeight: '700' },
  botonTextoClaro: { color: '#fff' },
  botonTextoOscuro: { color: colors.text },
  vacio: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl },
  vacioTitulo: { fontSize: 17, fontWeight: '700', color: colors.text },
  vacioTexto: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  encabezadoFila: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginBottom: space.lg },
  encabezado: { flex: 1, gap: 2 },
  coletilla: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  titulo: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
});
