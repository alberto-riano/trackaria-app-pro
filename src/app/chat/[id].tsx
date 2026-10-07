import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { hora } from '@/lib/format';
import { CONVERSACIONES, MENSAJES, type Mensaje } from '@/lib/mock';
import { colors, radius, space } from '@/lib/theme';

/**
 * Una conversación, con el mando del bot arriba.
 *
 * El control de «Bot / Tú» es el motivo de que esta pantalla exista. Mientras lo
 * lleva el bot **no se puede escribir**: si pudieras, acabaríais contestando los
 * dos a la vez a la misma persona. Para escribir hay que quitárselo, y eso es un
 * gesto explícito y reversible.
 */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversacion = CONVERSACIONES.find((item) => item.id === id) ?? CONVERSACIONES[0];

  const [bot, setBot] = useState(conversacion.bot);
  const [borrador, setBorrador] = useState('');
  const [mios, setMios] = useState<Mensaje[]>([]);
  const scroll = useRef<ScrollView>(null);

  const mensajes = useMemo(() => [...(MENSAJES[conversacion.id] ?? []), ...mios], [conversacion.id, mios]);
  // El aviso de «te atiende una persona» se manda con el primer mensaje real, no
  // al pulsar el botón: si intervienes y no llegas a escribir, nadie se entera.
  const primerMensajeTuyo = mios.length === 0;

  function enviar() {
    const texto = borrador.trim();
    if (!texto) return;
    setMios((actual) => [...actual, { id: `mio-${actual.length}`, de: 'yo', texto, cuando: new Date() }]);
    setBorrador('');
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}>
      <Stack.Screen options={{ title: conversacion.persona }} />

      <Mando bot={bot} onCambiar={setBot} />

      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.hilo}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        {mensajes.map((mensaje) => (
          <Burbuja key={mensaje.id} mensaje={mensaje} />
        ))}
      </ScrollView>

      {bot ? (
        <View style={styles.bloqueado}>
          <Ionicons name="sparkles" size={18} color={colors.bot} />
          <Text style={styles.bloqueadoTexto}>
            Está contestando el bot. Toca <Text style={styles.negrita}>Contesto yo</Text> para escribir tú.
          </Text>
        </View>
      ) : (
        <View style={styles.barra}>
          {primerMensajeTuyo ? (
            <Text style={styles.aviso}>Al enviar, se le dirá que a partir de ahora le atiende una persona.</Text>
          ) : null}
          <View style={styles.campoFila}>
            <TextInput
              style={styles.campo}
              value={borrador}
              onChangeText={setBorrador}
              placeholder="Escribe un mensaje…"
              placeholderTextColor={colors.faint}
              multiline
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar"
              onPress={enviar}
              style={({ pressed }) => [
                styles.enviar,
                !borrador.trim() && styles.enviarApagado,
                pressed && { opacity: 0.7 },
              ]}>
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

/** Quién contesta. Dos opciones y siempre a la vista. */
function Mando({ bot, onCambiar }: { bot: boolean; onCambiar: (valor: boolean) => void }) {
  return (
    <View style={styles.mando}>
      <Opcion
        activa={bot}
        icono="sparkles"
        texto="Lo lleva el bot"
        color={colors.bot}
        fondo={colors.botSoft}
        onPress={() => onCambiar(true)}
      />
      <Opcion
        activa={!bot}
        icono="person"
        texto="Contesto yo"
        color={colors.brandDark}
        fondo={colors.brandSoft}
        onPress={() => onCambiar(false)}
      />
    </View>
  );
}

function Opcion({
  activa, icono, texto, color, fondo, onPress,
}: {
  activa: boolean;
  icono: 'sparkles' | 'person';
  texto: string;
  color: string;
  fondo: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: activa }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.opcion,
        activa && { backgroundColor: fondo, borderColor: color },
        pressed && { opacity: 0.8 },
      ]}>
      <Ionicons name={icono} size={15} color={activa ? color : colors.faint} />
      <Text style={[styles.opcionTexto, { color: activa ? color : colors.faint }]}>{texto}</Text>
    </Pressable>
  );
}

function Burbuja({ mensaje }: { mensaje: Mensaje }) {
  const mio = mensaje.de === 'yo';
  const esBot = mensaje.de === 'bot';
  return (
    <View style={[styles.burbujaFila, mio && styles.burbujaFilaMia]}>
      <View style={[styles.burbuja, mio && styles.burbujaMia, esBot && styles.burbujaBot]}>
        {esBot ? (
          <View style={styles.firma}>
            <Ionicons name="sparkles" size={11} color={colors.bot} />
            <Text style={styles.firmaTexto}>Bot</Text>
          </View>
        ) : null}
        <Text style={[styles.burbujaTexto, mio && styles.burbujaTextoMio]}>{mensaje.texto}</Text>
        <Text style={[styles.burbujaHora, mio && styles.burbujaHoraMia]}>{hora(mensaje.cuando)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.background },
  mando: {
    flexDirection: 'row', gap: space.sm, padding: space.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  opcion: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    minHeight: 40, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
  },
  opcionTexto: { fontSize: 14, fontWeight: '700' },
  hilo: { padding: space.lg, gap: space.sm },
  burbujaFila: { flexDirection: 'row' },
  burbujaFilaMia: { justifyContent: 'flex-end' },
  burbuja: {
    maxWidth: '82%', backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: space.md, gap: 3,
  },
  burbujaBot: { backgroundColor: colors.botSoft, borderColor: '#ddd6fe' },
  burbujaMia: { backgroundColor: colors.brand, borderColor: colors.brand },
  firma: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  firmaTexto: { fontSize: 11, fontWeight: '800', color: colors.bot, letterSpacing: 0.3 },
  burbujaTexto: { fontSize: 15, color: colors.text, lineHeight: 21 },
  burbujaTextoMio: { color: '#fff' },
  burbujaHora: { fontSize: 11, color: colors.faint, alignSelf: 'flex-end' },
  burbujaHoraMia: { color: 'rgba(255,255,255,0.75)' },
  bloqueado: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    padding: space.lg, paddingBottom: space.xl,
  },
  bloqueadoTexto: { flex: 1, fontSize: 14, color: colors.muted, lineHeight: 20 },
  negrita: { fontWeight: '800', color: colors.brandDark },
  barra: {
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    padding: space.md, paddingBottom: space.xl, gap: space.sm,
  },
  aviso: { fontSize: 12, color: colors.faint, paddingHorizontal: space.xs },
  campoFila: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  campo: {
    flex: 1, maxHeight: 120, minHeight: 44, borderRadius: radius.lg,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: space.md, paddingTop: space.md, paddingBottom: space.md,
    fontSize: 15, color: colors.text,
  },
  enviar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  enviarApagado: { backgroundColor: colors.faint },
});
