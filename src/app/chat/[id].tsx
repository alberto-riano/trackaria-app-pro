import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';

import { ApiError, endpoints, type Mensaje } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { hora } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Una conversación, con el mando del bot arriba.
 *
 * El control de «Bot / Contesto yo» es el motivo de que esta pantalla exista.
 * Mientras lo lleva el bot **no se puede escribir**: si pudieras, acabaríais
 * contestando los dos a la vez a la misma persona. Para escribir hay que
 * quitárselo, y eso es un gesto explícito y reversible.
 */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useSession();
  const { datos, error, recargar } = useDatos(
    useCallback((clave: string) => endpoints.chat(clave, id), [id]),
  );

  const [borrador, setBorrador] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const [fallo, setFallo] = useState('');
  const scroll = useRef<ScrollView>(null);

  const chat = datos?.chat ?? null;
  const mensajes = datos?.mensajes ?? [];
  // Se mira si ya ha escrito alguien del centro: el aviso al paciente se manda
  // con el primer mensaje real, así que solo hay que anunciarlo una vez.
  const yaIntervenido = mensajes.some((mensaje) => mensaje.de === 'centro');

  async function enviar() {
    const texto = borrador.trim();
    if (!texto || !token || enviando) return;
    setEnviando(true);
    setFallo('');
    try {
      await endpoints.enviar(token, id, texto);
      setBorrador('');
      await recargar();
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido enviar.');
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarMando(activo: boolean) {
    if (!token || cambiando || chat?.bot === activo) return;
    setCambiando(true);
    setFallo('');
    try {
      await endpoints.bot(token, id, activo);
      await recargar();
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido cambiar.');
    } finally {
      setCambiando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}>
      <Stack.Screen options={{ title: chat?.persona ?? '' }} />

      {chat ? <Mando bot={chat.bot} ocupado={cambiando} onCambiar={cambiarMando} /> : null}

      {error || fallo ? (
        <View style={styles.error} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorTexto}>{error || fallo}</Text>
        </View>
      ) : null}

      {chat === null ? (
        <ActivityIndicator color={colors.brand} style={styles.cargando} />
      ) : (
        <ScrollView
          ref={scroll}
          contentContainerStyle={styles.hilo}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
          {mensajes.map((mensaje) => (
            <Burbuja key={mensaje.id} mensaje={mensaje} />
          ))}
        </ScrollView>
      )}

      {chat?.bot !== false ? (
        <View style={styles.bloqueado}>
          <Ionicons name="sparkles" size={18} color={colors.bot} />
          <Text style={styles.bloqueadoTexto}>
            Está contestando el bot. Toca <Text style={styles.negrita}>Contesto yo</Text> para escribir tú.
          </Text>
        </View>
      ) : (
        <View style={styles.barra}>
          {!yaIntervenido ? (
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
              disabled={!borrador.trim() || enviando}
              onPress={enviar}
              style={({ pressed }) => [
                styles.enviar,
                (!borrador.trim() || enviando) && styles.enviarApagado,
                pressed && { opacity: 0.7 },
              ]}>
              {enviando ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="arrow-up" size={20} color="#fff" />}
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

/** Quién contesta. Dos opciones y siempre a la vista. */
function Mando({ bot, ocupado, onCambiar }: { bot: boolean; ocupado: boolean; onCambiar: (valor: boolean) => void }) {
  return (
    <View style={styles.mando}>
      <Opcion
        activa={bot}
        ocupado={ocupado}
        icono="sparkles"
        texto="Lo lleva el bot"
        color={colors.bot}
        fondo={colors.botSoft}
        onPress={() => onCambiar(true)}
      />
      <Opcion
        activa={!bot}
        ocupado={ocupado}
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
  activa, ocupado, icono, texto, color, fondo, onPress,
}: {
  activa: boolean;
  ocupado: boolean;
  icono: 'sparkles' | 'person';
  texto: string;
  color: string;
  fondo: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: activa, disabled: ocupado }}
      disabled={ocupado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.opcion,
        activa && { backgroundColor: fondo, borderColor: color },
        (pressed || ocupado) && { opacity: 0.8 },
      ]}>
      <Ionicons name={icono} size={15} color={activa ? color : colors.faint} />
      <Text style={[styles.opcionTexto, { color: activa ? color : colors.faint }]}>{texto}</Text>
    </Pressable>
  );
}

function Burbuja({ mensaje }: { mensaje: Mensaje }) {
  const esBot = mensaje.de === 'bot';
  // El bot contesta **en nombre del centro**, no es el paciente. Ponerlo a la
  // izquierda, del lado de quien escribe desde fuera, hacía leer la conversación
  // al revés. Va a la derecha, con los mensajes del centro, y se distingue por
  // el morado y por su firma.
  const nuestro = mensaje.de === 'centro' || esBot;
  const mio = mensaje.de === 'centro';
  return (
    <View style={[styles.burbujaFila, nuestro && styles.burbujaFilaMia]}>
      <View style={[styles.burbuja, mio && styles.burbujaMia, esBot && styles.burbujaBot]}>
        {esBot ? (
          <View style={styles.firma}>
            <Ionicons name="sparkles" size={11} color={colors.bot} />
            <Text style={styles.firmaTexto}>Bot</Text>
          </View>
        ) : null}
        {mio && mensaje.autor ? <Text style={styles.autor}>{mensaje.autor}</Text> : null}
        <Text style={[styles.burbujaTexto, mio && styles.burbujaTextoMio]}>{mensaje.texto}</Text>
        <Text style={[styles.burbujaHora, mio && styles.burbujaHoraMia]}>{hora(new Date(mensaje.cuando))}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.background },
  cargando: { marginTop: space.xxl },
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
  autor: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.3 },
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
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, padding: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
