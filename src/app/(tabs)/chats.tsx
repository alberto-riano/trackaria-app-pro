import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, EmptyState, Encabezado } from '@/components/ui';
import { endpoints, type Chat } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { timeAgo } from '@/lib/format';
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
  const { usuario } = useSession();
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');

  // Se espera a que pare de escribir: una consulta por letra sería pedirle al
  // servidor que busque «m», «mu», «mut»… para tirar las tres primeras.
  useEffect(() => {
    const reloj = setTimeout(() => setBusca(texto.trim()), 350);
    return () => clearTimeout(reloj);
  }, [texto]);

  const { datos, error, refrescando, refrescar } = useDatos(
    useCallback((token: string) => endpoints.chats(token, busca), [busca]),
    // Mientras se busca no se repasa solo: la lista cambiaría bajo el dedo
    // mientras lees los resultados.
    { cada: busca ? undefined : 15_000 },
  );

  const chats = datos?.chats ?? null;

  return (
    <ScrollView
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + space.lg }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.brand} />}>
      <Encabezado titulo="Chats" coletilla={usuario?.centro.nombre} />

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

      {!busca && chats && chats.length > 0 ? <Leyenda /> : null}

      {error ? (
        <View style={styles.error} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorTexto}>{error}</Text>
        </View>
      ) : null}

      {chats === null ? (
        <ActivityIndicator color={colors.brand} style={styles.cargando} />
      ) : chats.length === 0 ? (
        <EmptyState
          title={busca ? 'Nada con eso' : 'Todavía no hay conversaciones'}
          text={
            busca
              ? 'Se busca por el nombre, el teléfono y lo que se dijo en el chat.'
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

/** Qué significa cada icono. Una vez, no en cada fila. */
function Leyenda() {
  return (
    <View style={styles.leyenda}>
      <View style={styles.leyendaItem}>
        <Insignia bot />
        <Text style={styles.leyendaTexto}>Lo lleva el bot</Text>
      </View>
      <View style={styles.leyendaItem}>
        <Insignia bot={false} />
        <Text style={styles.leyendaTexto}>Lo lleva el centro</Text>
      </View>
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
          {item.ultimo || 'Sin mensajes'}
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
  leyenda: { flexDirection: 'row', gap: space.lg, marginBottom: space.md, paddingHorizontal: space.xs },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaTexto: { fontSize: 12, color: colors.muted, fontWeight: '600' },
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
