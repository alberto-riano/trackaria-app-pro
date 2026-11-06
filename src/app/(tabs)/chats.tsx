import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, EmptyState, Encabezado } from '@/components/ui';
import { ApiError, endpoints, type Chat } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { timeAgo } from '@/lib/format';
import { sinMarcas } from '@/lib/marcas';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Las conversaciones del WhatsApp del centro.
 *
 * Esto no pretende competir con WhatsApp leyendo: quien tenga el número en
 * coexistencia ya recibe los mensajes en su móvil. Lo que no tiene ahí es saber
 * **quién está contestando** —el bot o una persona— ni poder quitárselo de en
 * medio.
 *
 * Ese dato va en un icono colgado del avatar, donde cualquier chat pone el punto
 * de estado, en vez de en una etiqueta con texto por fila: con veinte
 * conversaciones, veinte veces la misma frase es ruido. Lo que significa cada
 * icono se explica una vez, arriba.
 */
export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const { token, usuario } = useSession();
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [quien, setQuien] = useState<Quien>('todos');

  // Se espera a que pare de escribir: una consulta por letra sería pedirle al
  // servidor que busque «m», «mu», «mut»… para tirar las tres primeras.
  useEffect(() => {
    const reloj = setTimeout(() => setBusca(texto.trim()), 350);
    return () => clearTimeout(reloj);
  }, [texto]);

  const { datos, error, refrescando, refrescar, recargar } = useDatos(
    useCallback((clave: string) => endpoints.chats(clave, busca), [busca]),
    // Mientras se busca no se repasa solo: la lista cambiaría bajo el dedo
    // mientras lees los resultados.
    { cada: busca ? undefined : 15_000 },
  );

  const todos = datos?.chats ?? null;
  const cuantos = {
    bot: (todos ?? []).filter((item) => item.bot).length,
    centro: (todos ?? []).filter((item) => !item.bot).length,
  };
  const chats = todos === null || quien === 'todos'
    ? todos
    : todos.filter((item) => (quien === 'bot' ? item.bot : !item.bot));

  const [cambiando, setCambiando] = useState(false);
  const [fallo, setFallo] = useState('');

  /**
   * El mando de todas a la vez.
   *
   * Se pregunta antes porque no tiene vuelta de un toque: devolvérselas todas
   * al bot le escribe «vuelve el asistente virtual» a cada uno de los que de
   * verdad llegaron a hablar contigo, y eso ya no se puede retirar.
   */
  function mandoDeTodas(bot: boolean) {
    Alert.alert(
      bot ? '¿Se las pasas todas al bot?' : '¿Las coges todas?',
      bot
        ? 'El bot volverá a contestar en todas las conversaciones. A quien estuvieras atendiendo tú se le avisará de que vuelve el asistente.'
        : 'El bot dejará de contestar en todas las conversaciones. No se avisa a nadie: a cada uno se le dirá cuando le escribas.',
      [
        { text: 'Ahora no', style: 'cancel' },
        { text: bot ? 'Pasárselas' : 'Cogerlas', onPress: () => aplicar(bot) },
      ],
    );
  }

  async function aplicar(bot: boolean) {
    if (!token || cambiando) return;
    setCambiando(true);
    setFallo('');
    try {
      await endpoints.botTodos(token, bot);
      await recargar();
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido cambiar.');
    } finally {
      setCambiando(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + space.lg }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.brand} />}>
      <Encabezado titulo="Chats" coletilla={usuario?.centro.nombre} />

      {!busca && todos && todos.length > 0 ? (
        <Mando cuantos={cuantos} ocupado={cambiando} onCambiar={mandoDeTodas} />
      ) : null}

      <View style={styles.buscador}>
        <Ionicons name="search" size={17} color={colors.faint} />
        <TextInput
          style={styles.campo}
          value={texto}
          onChangeText={setTexto}
          placeholder="Buscar por nombre o por lo que se dijo"
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {!busca && todos && todos.length > 0 ? (
        <Filtros quien={quien} onCambiar={setQuien} cuantos={cuantos} />
      ) : null}

      {error || fallo ? (
        <View style={styles.error} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorTexto}>{error || fallo}</Text>
        </View>
      ) : null}

      {chats === null ? (
        <ActivityIndicator color={colors.brand} style={styles.cargando} />
      ) : chats.length === 0 ? (
        <EmptyState
          title={
            busca ? 'Nada con eso'
              : quien !== 'todos' ? 'Ninguna por aquí'
                : 'Todavía no hay conversaciones'
          }
          text={
            busca ? 'Se busca por el nombre, el teléfono y lo que se dijo en el chat.'
              : quien === 'bot' ? 'Ahora mismo no hay ninguna conversación en manos del bot.'
                : quien === 'centro' ? 'No has cogido ninguna conversación. Toca el filtro otra vez para verlas todas.'
                  : 'Aquí aparecerán los chats del WhatsApp de tu centro en cuanto alguien escriba.'
          }
        />
      ) : (
        <View style={styles.lista}>
          {chats.map((item) => (
            <Fila key={item.id} item={item} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/**
 * Quién contesta en todas, de un gesto.
 *
 * Es la misma pastilla que hay dentro de una conversación y a propósito: la
 * decisión casi nunca es de un chat suelto. O entras a la sala y que conteste
 * el bot, o has terminado y las coges todas. Hacerlo chat a chat eran veinte
 * gestos para una sola intención, y era lo único del panel que no estaba aquí.
 *
 * La mitad levantada es la que ya vale para todas. Cuando hay de las dos no se
 * levanta ninguna: no hay un estado único que enseñar, y pintar uno sería
 * mentir sobre la mitad de las conversaciones.
 */
function Mando({
  cuantos, ocupado, onCambiar,
}: {
  cuantos: { bot: number; centro: number };
  ocupado: boolean;
  onCambiar: (bot: boolean) => void;
}) {
  const todasBot = cuantos.centro === 0;
  const todasMias = cuantos.bot === 0;
  return (
    <View style={styles.pastilla}>
      <Mitad
        puesta={todasBot}
        ocupado={ocupado}
        icono="sparkles"
        texto="Las lleva el bot"
        color={colors.bot}
        onPress={() => onCambiar(true)}
      />
      <Mitad
        puesta={todasMias}
        ocupado={ocupado}
        icono="person"
        texto="Las cojo yo"
        color={colors.brandDark}
        onPress={() => onCambiar(false)}
      />
    </View>
  );
}

function Mitad({
  puesta, ocupado, icono, texto, color, onPress,
}: {
  puesta: boolean;
  ocupado: boolean;
  icono: 'sparkles' | 'person';
  texto: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: puesta, disabled: ocupado || puesta }}
      accessibilityLabel={texto}
      // La que ya vale para todas no hace nada: tocarla pediría confirmación
      // para un cambio que no cambia nada.
      disabled={ocupado || puesta}
      onPress={onPress}
      style={({ pressed }) => [
        styles.mitad,
        puesta && styles.mitadPuesta,
        (pressed || ocupado) && { opacity: 0.8 },
      ]}>
      <Ionicons name={icono} size={15} color={puesta ? color : colors.muted} />
      <Text style={[styles.mitadTexto, { color: puesta ? color : colors.muted }]}>{texto}</Text>
    </Pressable>
  );
}

type Quien = 'todos' | 'bot' | 'centro';

/**
 * Qué significa cada icono y, de paso, el filtro.
 *
 * Esto era solo una leyenda y lo parecía a medias: dos iconos con su texto
 * debajo del buscador se leen como botones, se tocan y no pasa nada. Ahora
 * hacen lo que ya prometían, que además es la pregunta de verdad —«enséñame
 * solo las que llevo yo»—, y siguen explicando qué es cada icono.
 *
 * Filtra sobre lo que ya está cargado y no pide nada al servidor: son las
 * últimas cincuenta conversaciones y la respuesta tiene que ser instantánea.
 */
function Filtros({
  quien, onCambiar, cuantos,
}: {
  quien: Quien;
  onCambiar: (quien: Quien) => void;
  cuantos: { bot: number; centro: number };
}) {
  return (
    <View style={styles.leyenda}>
      {(['bot', 'centro'] as const).map((cual) => {
        const activo = quien === cual;
        return (
          <Pressable
            key={cual}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={
              activo
                ? `Quitar el filtro: ${cual === 'bot' ? 'lo lleva el bot' : 'lo lleva el centro'}`
                : `Ver solo las que ${cual === 'bot' ? 'lleva el bot' : 'lleva el centro'}`
            }
            // Volver a tocar el que ya está puesto lo quita: no hace falta un
            // tercer botón de «todas» que casi siempre sobra.
            onPress={() => onCambiar(activo ? 'todos' : cual)}
            style={({ pressed }) => [
              styles.leyendaItem, activo && styles.leyendaItemActivo, pressed && { opacity: 0.7 },
            ]}>
            <Insignia bot={cual === 'bot'} />
            <Text style={[styles.leyendaTexto, activo && styles.leyendaTextoActivo]}>
              {cual === 'bot' ? 'Lo lleva el bot' : 'Lo lleva el centro'}
            </Text>
            <Text style={[styles.leyendaCuenta, activo && styles.leyendaTextoActivo]}>
              {cuantos[cual]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Insignia({ bot }: { bot: boolean }) {
  return (
    <View style={[styles.marca, { backgroundColor: bot ? colors.botFuerte : colors.centroFuerte }]}>
      <Ionicons name={bot ? 'desktop' : 'person'} size={11} color="#fff" />
    </View>
  );
}

function Fila({ item }: { item: Chat }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.persona}. ${item.bot ? 'Lo lleva el bot' : 'Lo lleva el centro'}`}
      onPress={() => router.push(`/chat/${item.id}`)}
      style={({ pressed }) => [styles.fila, pressed && { opacity: 0.7 }]}>
      <Avatar
        nombre={item.persona}
        tono={item.esperando ? 'alerta' : 'neutral'}
        insignia={<Insignia bot={item.bot} />}
      />

      <View style={styles.texto}>
        <View style={styles.linea}>
          <Text style={styles.persona} numberOfLines={1}>{item.persona}</Text>
          <Text style={styles.cuando}>{timeAgo(new Date(item.cuando))}</Text>
        </View>

        <Text style={[styles.ultimo, item.sin_leer > 0 && styles.ultimoSinLeer]} numberOfLines={1}>
          {sinMarcas(item.ultimo) || 'Sin mensajes'}
        </Text>

        {item.esperando ? <Text style={styles.esperando}>Te está esperando</Text> : null}
      </View>

      {item.sin_leer > 0 ? (
        <View style={styles.contador}>
          <Text style={styles.contadorTexto}>{item.sin_leer}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, paddingBottom: space.xxl },
  cargando: { marginTop: space.xxl },
  buscador: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: space.md, marginBottom: space.md,
  },
  campo: { flex: 1, minHeight: 42, fontSize: 15, color: colors.text },
  pastilla: {
    flexDirection: 'row', padding: 3, gap: 3, marginBottom: space.md,
    borderRadius: radius.pill, backgroundColor: colors.border,
  },
  mitad: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    minHeight: 38, borderRadius: radius.pill,
  },
  mitadPuesta: {
    backgroundColor: colors.surface,
    shadowColor: '#0c1f31', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  mitadTexto: { fontSize: 14, fontWeight: '700' },
  leyenda: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  leyendaItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: 7, paddingHorizontal: space.sm,
  },
  leyendaItemActivo: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  leyendaTexto: { flex: 1, fontSize: 12, color: colors.muted, fontWeight: '600' },
  leyendaTextoActivo: { color: colors.brandDark },
  leyendaCuenta: { fontSize: 12, fontWeight: '800', color: colors.faint },
  marca: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  lista: { gap: space.sm },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: space.md, paddingBottom: space.md + 4,
  },
  texto: { flex: 1, gap: 3 },
  linea: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  persona: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  cuando: { fontSize: 12, color: colors.faint },
  ultimo: { fontSize: 14, color: colors.muted },
  ultimoSinLeer: { color: colors.text, fontWeight: '600' },
  esperando: { fontSize: 11, fontWeight: '800', color: colors.warning, marginTop: 1 },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md, marginBottom: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
  contador: {
    minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
  },
  contadorTexto: { fontSize: 12, fontWeight: '800', color: '#fff' },
});
