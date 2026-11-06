import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, endpoints, type Chat, type Mensaje } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { hora } from '@/lib/format';
import { conMarcas } from '@/lib/marcas';
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
    // Una conversación abierta es lo más parecido a WhatsApp que hay aquí:
    // mientras la miras, los mensajes que entran tienen que aparecer solos.
    { cada: 8_000 },
  );

  const [borrador, setBorrador] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const [fallo, setFallo] = useState('');
  const scroll = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Abrir el teclado no cambia el contenido, solo el alto, así que el hilo no
  // se movía solo y el último mensaje quedaba tapado. Se baja al final en
  // cuanto el teclado termina de subir.
  //
  // Y de paso se apunta si está puesto, que es lo que decide el hueco de abajo:
  // con el teclado delante, el sitio del indicador de inicio y el de la barra
  // de Android ya no están ahí, y reservarlo igual deja una franja en blanco
  // entre lo que escribes y las teclas.
  const [teclado, setTeclado] = useState(false);
  useEffect(() => {
    const abierto = Keyboard.addListener('keyboardDidShow', () => {
      setTeclado(true);
      scroll.current?.scrollToEnd({ animated: true });
    });
    const cerrado = Keyboard.addListener('keyboardDidHide', () => setTeclado(false));
    return () => {
      abierto.remove();
      cerrado.remove();
    };
  }, []);

  /**
   * Lo que hay que dejar libre debajo de la barra de escribir.
   *
   * Eran 24 puntos fijos y en Android no llegan: allí la app se pinta por
   * debajo de la barra de botones del sistema, así que el campo de texto y el
   * botón de enviar salían cortados por el borde de abajo. El hueco lo dice el
   * móvil —`insets.bottom`—, con un mínimo para los que no reservan nada.
   */
  const abajo = teclado ? space.md : Math.max(insets.bottom, space.md) + space.xs;

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
      // La altura de la cabecera, medida y no a ojo: eran 96 puntos fijos, y
      // en un móvil con más muesca el hilo subía de menos y el último mensaje
      // se quedaba debajo del teclado, que es justo el que querías leer.
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}>
      <Stack.Screen options={{ headerTitle: () => (chat ? <Titulo chat={chat} /> : null) }} />

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
        <View style={[styles.bloqueado, { paddingBottom: abajo }]}>
          <Ionicons name="sparkles" size={18} color={colors.bot} />
          <Text style={styles.bloqueadoTexto}>
            Está contestando el bot. Toca <Text style={styles.resalte}>Contesto yo</Text> para escribir tú.
          </Text>
        </View>
      ) : (
        <View style={[styles.barra, { paddingBottom: abajo }]}>
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

/**
 * El nombre de quien escribe y, detrás, su ficha.
 *
 * Es leyendo la conversación cuando hace falta lo que la conversación no
 * cuenta —cuántas sesiones le quedan del bono, a qué clases viene—, y hasta
 * ahora eso eran cuatro pasos: atrás, Alumnos, buscar y escribir el nombre.
 *
 * Si el número no está dado de alta no hay ficha a la que ir, y entonces es
 * texto a secas: un nombre con galón que no lleva a ningún sitio se toca una
 * vez, no pasa nada, y ya no se vuelve a tocar el de los que sí llevan.
 */
function Titulo({ chat }: { chat: Chat }) {
  if (!chat.alumno) {
    return <Text style={styles.tituloSolo} numberOfLines={1}>{chat.persona}</Text>;
  }
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Ver la ficha de ${chat.persona}`}
      onPress={() => router.push(`/alumno/${chat.alumno}`)}
      style={({ pressed }) => [styles.titulo, pressed && { opacity: 0.6 }]}>
      <Text style={styles.tituloTexto} numberOfLines={1}>{chat.persona}</Text>
      <Ionicons name="chevron-forward" size={15} color={colors.brand} />
    </Pressable>
  );
}

/** Quién contesta. Dos opciones y siempre a la vista. */
function Mando({ bot, ocupado, onCambiar }: { bot: boolean; ocupado: boolean; onCambiar: (valor: boolean) => void }) {
  return (
    <View style={styles.mando}>
      {/* Una píldora de dos mitades y no dos botones sueltos: lo que se elige
          es entre dos, y así se ve de un vistazo cuál está puesta sin tener
          que comparar dos bordes. */}
      <View style={styles.pastilla}>
        <Opcion
          activa={bot}
          ocupado={ocupado}
          icono="sparkles"
          texto="Lo lleva el bot"
          color={colors.bot}
          onPress={() => onCambiar(true)}
        />
        <Opcion
          activa={!bot}
          ocupado={ocupado}
          icono="person"
          texto="Contesto yo"
          color={colors.brandDark}
          onPress={() => onCambiar(false)}
        />
      </View>
    </View>
  );
}

function Opcion({
  activa, ocupado, icono, texto, color, onPress,
}: {
  activa: boolean;
  ocupado: boolean;
  icono: 'sparkles' | 'person';
  texto: string;
  /**
   * El de quien contesta: morado el bot, verde tú.
   *
   * Son los mismos de las burbujas, y por eso cada mitad lleva el suyo en vez
   * de uno solo para las dos. Leyendo el hilo, el morado ya quiere decir «esto
   * lo ha escrito el bot»; si el mando fuese verde con el bot puesto, el color
   * dejaría de significar nada. Puesto solo en el texto y el icono, y con la
   * mitad elegida en blanco, el morado ocupa una décima parte de lo que
   * ocupaba y sigue diciendo lo mismo.
   */
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: activa, disabled: ocupado }}
      disabled={ocupado || activa}
      onPress={onPress}
      style={({ pressed }) => [
        styles.opcion,
        activa && styles.opcionActiva,
        (pressed || ocupado) && { opacity: 0.8 },
      ]}>
      <Ionicons name={icono} size={15} color={activa ? color : colors.muted} />
      <Text style={[styles.opcionTexto, { color: activa ? color : colors.muted }]}>{texto}</Text>
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
  const cuando = hora(new Date(mensaje.cuando));
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
        <Text style={[styles.burbujaTexto, mio && styles.burbujaTextoMio]}>
          {conMarcas(mensaje.texto).map((trozo, orden) => (
            <Text key={orden} style={trozo.estilos.map((estilo) => styles[estilo])}>{trozo.texto}</Text>
          ))}
          {/* El sitio de la hora, pintado en transparente y dentro del texto.
              La hora de verdad va suelta en la esquina, así que si no se le
              reservara el hueco se le montaría encima a la última palabra. Al
              ir aquí dentro, la última línea la rodea como en WhatsApp, y
              cuando no cabe se baja ella sola. Los espacios son `figure
              space`: no se parten de línea y no se los come el salto. */}
          <Text style={styles.hueco}>{`\u2007\u2007${cuando}`}</Text>
        </Text>
        <Text style={[styles.burbujaHora, mio && styles.burbujaHoraMia]}>{cuando}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.background },
  cargando: { marginTop: space.xxl },
  mando: {
    padding: space.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  pastilla: {
    flexDirection: 'row', padding: 3, gap: 3,
    borderRadius: radius.pill, backgroundColor: colors.border,
  },
  opcion: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    minHeight: 38, borderRadius: radius.pill,
  },
  // La mitad puesta se levanta sobre la otra: en blanco y con una sombra corta,
  // que es lo que la hace parecer una pastilla encima y no un trozo pintado.
  opcionActiva: {
    backgroundColor: colors.surface,
    shadowColor: '#0c1f31', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  opcionTexto: { fontSize: 14, fontWeight: '700' },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 2, maxWidth: 240 },
  tituloTexto: { flexShrink: 1, fontSize: 17, fontWeight: '700', color: colors.text },
  tituloSolo: { maxWidth: 240, fontSize: 17, fontWeight: '700', color: colors.text },
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
  // El formato de WhatsApp dentro de la burbuja. Van sueltos y no mezclados
  // con el estilo del texto porque un trozo puede llevar varios a la vez.
  negrita: { fontWeight: '700' },
  cursiva: { fontStyle: 'italic' },
  tachado: { textDecorationLine: 'line-through' },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
  // Flotando en la esquina y no en una línea suya: una línea entera para
  // cinco caracteres dejaba tres mensajes donde caben cinco.
  burbujaHora: { position: 'absolute', right: space.md, bottom: space.md, fontSize: 11, color: colors.faint },
  hueco: { fontSize: 11, color: 'transparent' },
  burbujaHoraMia: { color: 'rgba(255,255,255,0.75)' },
  bloqueado: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    padding: space.lg,
  },
  bloqueadoTexto: { flex: 1, fontSize: 14, color: colors.muted, lineHeight: 20 },
  resalte: { fontWeight: '800', color: colors.brandDark },
  barra: {
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    padding: space.md, gap: space.sm,
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
