import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Encabezado } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { CENTRO, CONVERSACIONES, type Conversacion } from '@/lib/mock';
import { colors, radius, space } from '@/lib/theme';

/**
 * Las conversaciones del WhatsApp del centro.
 *
 * Esto no pretende competir con WhatsApp leyendo: quien tenga el número en
 * coexistencia ya recibe los mensajes en su móvil. Lo que no tiene ahí es saber
 * **quién está contestando** —el bot o una persona— ni poder quitárselo de en
 * medio. Por eso cada fila dice de quién es la conversación ahora mismo.
 */
export default function ChatsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + space.lg }]}
      showsVerticalScrollIndicator={false}>
      <Encabezado titulo="Chats" coletilla={CENTRO} />
      <View style={styles.lista}>
        {CONVERSACIONES.map((item) => (
          <Fila key={item.id} item={item} />
        ))}
      </View>
    </ScrollView>
  );
}

function Fila({ item }: { item: Conversacion }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/chat/${item.id}`)}
      style={({ pressed }) => [styles.fila, pressed && { opacity: 0.7 }]}>
      <Avatar nombre={item.persona} tono={item.esperando ? 'alerta' : 'neutral'} />

      <View style={styles.texto}>
        <View style={styles.linea}>
          <Text style={styles.persona} numberOfLines={1}>{item.persona}</Text>
          <Text style={styles.cuando}>{timeAgo(item.cuando)}</Text>
        </View>

        <Text style={[styles.ultimo, item.sinLeer > 0 && styles.ultimoSinLeer]} numberOfLines={1}>
          {item.ultimo}
        </Text>

        <View style={styles.pie}>
          {/* Quién lleva la conversación. Es el dato que no tienes en WhatsApp. */}
          <View style={[styles.quien, item.bot ? styles.quienBot : styles.quienTuyo]}>
            <Ionicons
              name={item.bot ? 'sparkles' : 'person'}
              size={11}
              color={item.bot ? colors.bot : colors.brandDark}
            />
            <Text style={[styles.quienTexto, { color: item.bot ? colors.bot : colors.brandDark }]}>
              {item.bot ? 'Lo lleva el bot' : 'La llevas tú'}
            </Text>
          </View>
          {item.esperando ? (
            <Text style={styles.esperando}>· te está esperando</Text>
          ) : null}
        </View>
      </View>

      {item.sinLeer > 0 ? (
        <View style={styles.contador}>
          <Text style={styles.contadorTexto}>{item.sinLeer}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, paddingBottom: space.xxl },
  lista: { gap: space.sm },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: space.md,
  },
  texto: { flex: 1, gap: 3 },
  linea: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  persona: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  cuando: { fontSize: 12, color: colors.faint },
  ultimo: { fontSize: 14, color: colors.muted },
  ultimoSinLeer: { color: colors.text, fontWeight: '600' },
  pie: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  quien: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill },
  quienBot: { backgroundColor: colors.botSoft },
  quienTuyo: { backgroundColor: colors.brandSoft },
  quienTexto: { fontSize: 11, fontWeight: '700' },
  esperando: { fontSize: 11, fontWeight: '700', color: colors.warning },
  contador: {
    minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
  },
  contadorTexto: { fontSize: 12, fontWeight: '800', color: '#fff' },
});
