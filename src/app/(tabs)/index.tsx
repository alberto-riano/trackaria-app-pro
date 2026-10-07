import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Boton, Card, Chip, EmptyState, Encabezado } from '@/components/ui';
import { ApiError, endpoints, type Pendiente } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { comoFecha, dayTitle, minutosDesde, timeAgo } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Lo que espera una respuesta tuya.
 *
 * Es la razón de ser de la app. El bot atiende solo y lo hace bien casi siempre;
 * esta pantalla es el «casi». Si está vacía, la app no tiene nada que contarte y
 * eso es exactamente lo que debería pasar la mayoría de los días.
 */
export default function PendienteScreen() {
  const insets = useSafeAreaInsets();
  const { usuario, token } = useSession();
  const { datos, error, refrescando, refrescar, recargar } = useDatos(
    useCallback((clave: string) => endpoints.pendientes(clave), []),
  );
  const [confirmando, setConfirmando] = useState('');
  const [fallo, setFallo] = useState('');

  const cola = datos?.pendientes ?? null;

  async function confirmar(id: string) {
    if (!token) return;
    setConfirmando(id);
    setFallo('');
    try {
      await endpoints.confirmarCita(token, id);
      await recargar();
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido confirmar.');
    } finally {
      setConfirmando('');
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + space.lg }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.brand} />}>
      <Encabezado
        titulo="Pendiente"
        coletilla={usuario?.centro.nombre}
        accion={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tu cuenta"
            onPress={() => router.push('/cuenta')}
            style={({ pressed }) => [styles.cuenta, pressed && { opacity: 0.7 }]}>
            <Ionicons name="person-circle-outline" size={26} color={colors.muted} />
          </Pressable>
        }
      />

      {error || fallo ? (
        <View style={styles.error} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorTexto}>{error || fallo}</Text>
        </View>
      ) : null}

      {cola === null ? (
        <ActivityIndicator color={colors.brand} style={styles.cargando} />
      ) : cola.length === 0 ? (
        <Card style={styles.tranquilo}>
          <View style={styles.tranquiloIcono}>
            <Ionicons name="checkmark-done" size={26} color={colors.brand} />
          </View>
          <EmptyState
            title="Nada que decidir"
            text="El bot está llevando las conversaciones. Aquí aparecerá quien pida hablar con una persona y las citas que falten por confirmar."
          />
        </Card>
      ) : (
        <>
          <Text style={styles.resumen}>
            {cola.length === 1 ? '1 cosa espera tu respuesta' : `${cola.length} cosas esperan tu respuesta`}
          </Text>
          <View style={styles.lista}>
            {cola.map((item) =>
              item.tipo === 'conversacion' ? (
                <TarjetaConversacion key={item.id} item={item} />
              ) : (
                <TarjetaCita
                  key={item.id}
                  item={item}
                  ocupado={confirmando === item.id}
                  onConfirmar={() => confirmar(item.id)}
                />
              ),
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

/** Cuánto lleva esperando. En rojo a partir de media hora, que es lo que duele. */
function Espera({ desde }: { desde: string }) {
  if (!desde) return null;
  const tarde = minutosDesde(desde) >= 30;
  return (
    <View style={styles.espera}>
      <Ionicons name="time-outline" size={14} color={tarde ? colors.danger : colors.faint} />
      <Text style={[styles.esperaTexto, tarde && { color: colors.danger, fontWeight: '700' }]}>
        esperando {timeAgo(new Date(desde)).replace('hace ', '')}
      </Text>
    </View>
  );
}

function TarjetaConversacion({ item }: { item: Extract<Pendiente, { tipo: 'conversacion' }> }) {
  return (
    <Card style={styles.tarjeta}>
      <View style={[styles.franja, { backgroundColor: colors.warning }]} />
      <View style={styles.cuerpo}>
        <View style={styles.cabecera}>
          <Avatar nombre={item.persona} tono="alerta" />
          <View style={styles.cabeceraTexto}>
            <Text style={styles.persona}>{item.persona}</Text>
            <Chip label={item.motivo_texto} tone="warning" />
          </View>
        </View>

        {/* Lo que dijo, literal. Es lo único que te deja decidir si corre prisa. */}
        {item.mensaje ? <Text style={styles.cita}>«{item.mensaje}»</Text> : null}

        <Espera desde={item.desde} />

        <Boton titulo="Entrar en la conversación" onPress={() => router.push(`/chat/${item.id}`)} />
      </View>
    </Card>
  );
}

function TarjetaCita({
  item, ocupado, onConfirmar,
}: {
  item: Extract<Pendiente, { tipo: 'cita' }>;
  ocupado: boolean;
  onConfirmar: () => void;
}) {
  const { cita } = item;
  return (
    <Card style={styles.tarjeta}>
      <View style={[styles.franja, { backgroundColor: cita.color || colors.brand }]} />
      <View style={styles.cuerpo}>
        <View style={styles.cabecera}>
          <Avatar nombre={item.persona} />
          <View style={styles.cabeceraTexto}>
            <Text style={styles.persona}>{item.persona}</Text>
            <Chip label="Sin confirmar" tone="brand" />
          </View>
        </View>

        <View style={styles.hueco}>
          <Text style={styles.cuando}>
            {dayTitle(comoFecha(cita.fecha))} · {cita.hora}
          </Text>
          <Text style={styles.detalle}>
            {[cita.tratamiento, cita.profesional].filter(Boolean).join(' · ')}
          </Text>
        </View>

        <Espera desde={item.desde} />

        <Boton titulo={ocupado ? 'Confirmando…' : 'Confirmar la cita'} onPress={onConfirmar} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  cargando: { marginTop: space.xxl },
  cuenta: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  resumen: { fontSize: 15, color: colors.muted, fontWeight: '600', marginTop: -space.sm },
  lista: { gap: space.md },
  tarjeta: { flexDirection: 'row', gap: space.lg, padding: 0, overflow: 'hidden' },
  franja: { width: 5 },
  cuerpo: { flex: 1, gap: space.md, padding: space.lg, paddingLeft: 0 },
  cabecera: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  cabeceraTexto: { flex: 1, gap: 5 },
  persona: { fontSize: 17, fontWeight: '800', color: colors.text },
  cita: { fontSize: 15, color: colors.text, lineHeight: 22, fontStyle: 'italic' },
  hueco: { backgroundColor: colors.background, borderRadius: radius.md, padding: space.md, gap: 3 },
  cuando: { fontSize: 17, fontWeight: '800', color: colors.text },
  detalle: { fontSize: 14, color: colors.muted },
  espera: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  esperaTexto: { fontSize: 13, color: colors.faint },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
  tranquilo: { alignItems: 'center', gap: space.sm },
  tranquiloIcono: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center', marginTop: space.sm,
  },
});
