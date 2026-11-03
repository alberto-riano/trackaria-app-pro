import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Boton, Card, Chip, EmptyState, Encabezado } from '@/components/ui';
import { ApiError, endpoints, type Pendiente } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { comoFecha, dayTitle, minutosDesde } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Por dónde se entra en la app.
 *
 * «Pendiente» es la casa de un centro con WhatsApp, no la de un estudio de
 * clases: sin canal no hay bot, no hay conversaciones y esta pantalla no podría
 * tener nada nunca. Las pestañas ya lo saben, pero la app abre por la primera,
 * así que hay que mandarla a donde se trabaja de verdad.
 *
 * El desvío va aquí fuera y no dentro de la pantalla para que la pantalla no
 * llegue a pedirle nada al servidor cuando no es la que toca.
 */
export default function Inicio() {
  const { usuario } = useSession();
  const centro = usuario?.centro;
  if (centro && centro.whatsapp === false) {
    return <Redirect href={centro.clases ? '/clases' : '/agenda'} />;
  }
  return <PendienteScreen />;
}

/**
 * Lo que espera una respuesta tuya.
 *
 * Es la razón de ser de la app. El bot atiende solo y lo hace bien casi siempre;
 * esta pantalla es el «casi». Si está vacía, la app no tiene nada que contarte y
 * eso es exactamente lo que debería pasar la mayoría de los días.
 */
function PendienteScreen() {
  const insets = useSafeAreaInsets();
  const { usuario, token } = useSession();
  const { datos, error, refrescando, refrescar, recargar } = useDatos(
    useCallback((clave: string) => endpoints.pendientes(clave), []),
    { cada: 20_000 },
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
      <Encabezado titulo="Pendiente" coletilla={usuario?.centro.nombre} />

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
          {/* Un centro sin consulta no tiene citas que confirmar, y prometerle
              que aparecerán aquí es dejarle esperando algo que no llega. */}
          <EmptyState
            title="Nada que decidir"
            text={
              usuario?.centro.citas === false
                ? 'El bot está llevando las conversaciones. Aquí aparecerá quien pida hablar con una persona.'
                : 'El bot está llevando las conversaciones. Aquí aparecerá quien pida hablar con una persona y las citas que falten por confirmar.'
            }
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

/** Cuánto lleva esperando, dicho entero.
 *
 * Antes salía de quitarle el «hace» a la fecha relativa, y eso producía
 * «esperando ahora mismo» y «esperando ayer», que no se dicen.
 */
function cuantoLleva(minutos: number) {
  if (minutos < 1) return 'acaba de llegar';
  if (minutos < 60) return `esperando ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `esperando ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? 'esperando desde ayer' : `esperando ${dias} días`;
}

/** En rojo a partir de media hora, que es lo que duele. */
function Espera({ desde }: { desde: string }) {
  if (!desde) return null;
  const minutos = minutosDesde(desde);
  const tarde = minutos >= 30;
  return (
    <View style={styles.espera}>
      <Ionicons name="time-outline" size={14} color={tarde ? colors.danger : colors.faint} />
      <Text
        style={[styles.esperaTexto, tarde && { color: colors.danger, fontWeight: '700' }]}
        numberOfLines={1}>
        {cuantoLleva(minutos)}
      </Text>
    </View>
  );
}

function TarjetaConversacion({ item }: { item: Extract<Pendiente, { tipo: 'conversacion' }> }) {
  return (
    <Card style={styles.tarjeta}>
      <View style={[styles.franja, { backgroundColor: colors.warning }]} />
      <View style={styles.cuerpo}>
        {/* Aquí el motivo va debajo del nombre y no al lado, al revés que en una
            cita: «Sin confirmar» son dos palabras y «Pide hablar con una
            persona» son cinco, y en la misma línea se comía el nombre. */}
        <View style={styles.cabecera}>
          <Avatar nombre={item.persona} tono="alerta" />
          <View style={styles.cabeceraTexto}>
            <Text style={styles.persona} numberOfLines={1}>{item.persona}</Text>
            <Chip label={item.motivo_texto} tone="warning" />
          </View>
        </View>

        {/* Lo que dijo, literal. Es lo único que te deja decidir si corre prisa. */}
        {item.mensaje ? (
          <Text style={styles.cita} numberOfLines={2}>«{item.mensaje}»</Text>
        ) : null}

        <View style={styles.pie}>
          <Espera desde={item.desde} />
          <Boton
            titulo="Entrar"
            style={styles.botonCompacto}
            onPress={() => router.push(`/chat/${item.id}`)}
          />
        </View>
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
          <Text style={styles.persona} numberOfLines={1}>{item.persona}</Text>
          <Chip label="Sin confirmar" tone="brand" />
        </View>

        {/* Sin recuadro gris alrededor: la fecha ya destaca por tamaño, y la caja
            solo añadía altura a una tarjeta de la que caben tres en pantalla. */}
        <View style={styles.cuando}>
          <Text style={styles.cuandoFecha}>
            {dayTitle(comoFecha(cita.fecha))} · {cita.hora}
          </Text>
          <Text style={styles.detalle} numberOfLines={1}>
            {[cita.tratamiento, cita.profesional].filter(Boolean).join(' · ')}
          </Text>
        </View>

        <View style={styles.pie}>
          <Espera desde={item.desde} />
          <Boton
            titulo={ocupado ? 'Confirmando…' : 'Confirmar'}
            style={styles.botonCompacto}
            onPress={onConfirmar}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  cargando: { marginTop: space.xxl },
  resumen: { fontSize: 15, color: colors.muted, fontWeight: '600', marginTop: -space.sm },
  lista: { gap: space.md },
  tarjeta: { flexDirection: 'row', gap: space.md, padding: 0, overflow: 'hidden' },
  franja: { width: 4 },
  cuerpo: { flex: 1, gap: space.sm, padding: space.md, paddingLeft: 0 },
  // El nombre y la etiqueta, en la misma línea. Antes la etiqueta iba debajo
  // del nombre y cada tarjeta se llevaba una línea entera para dos palabras.
  cabecera: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  cabeceraTexto: { flex: 1, alignItems: 'flex-start', gap: 4 },
  persona: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  cita: { fontSize: 14, color: colors.text, lineHeight: 20, fontStyle: 'italic' },
  cuando: { gap: 1 },
  cuandoFecha: { fontSize: 16, fontWeight: '800', color: colors.text },
  detalle: { fontSize: 13, color: colors.muted },
  // La espera y el botón comparten línea: son la pregunta y la respuesta.
  pie: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  botonCompacto: { minHeight: 38, paddingHorizontal: space.lg },
  espera: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
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
