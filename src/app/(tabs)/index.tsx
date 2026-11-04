import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
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
  const [decidiendo, setDecidiendo] = useState('');
  const [fallo, setFallo] = useState('');

  const cola = datos?.pendientes ?? null;
  const hablando = (cola ?? []).filter((item) => item.tipo === 'conversacion');
  const citas = (cola ?? []).filter((item) => item.tipo === 'cita');

  async function decidir(id: string, confirmada: boolean) {
    if (!token) return;
    setDecidiendo(id);
    setFallo('');
    try {
      const { avisado } = confirmada
        ? await endpoints.confirmarCita(token, id)
        : await endpoints.rechazarCita(token, id);
      // Quien pidió la cita por WhatsApp recibe la respuesta por WhatsApp. Si
      // no hay conversación, no se entera de nada y hay que llamarle: decirlo
      // es la diferencia entre un trabajo terminado y uno a medias.
      if (!avisado) {
        setFallo(
          confirmada
            ? 'Confirmada, pero no se le ha podido avisar por WhatsApp. Llámale.'
            : 'Rechazada, pero no se le ha podido avisar por WhatsApp. Llámale.',
        );
      }
      await recargar();
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido hacer.');
    } finally {
      setDecidiendo('');
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
                ? 'El bot está llevando las conversaciones. Aquí aparecerá quien quiera hablar contigo.'
                : 'El bot está llevando las conversaciones. Aquí aparecerá quien quiera hablar contigo y las citas que falten por confirmar.'
            }
          />
        </Card>
      ) : (
        <>
          <Text style={styles.resumen}>
            {cola.length === 1 ? '1 cosa espera tu respuesta' : `${cola.length} cosas esperan tu respuesta`}
          </Text>

          {/* Las dos cosas van separadas y en este orden a propósito. Una
              persona esperando en WhatsApp está esperando ahora; una cita sin
              confirmar aguanta diez minutos. Mezcladas por antigüedad, lo
              urgente quedaba enterrado entre lo que puede esperar. */}
          {/* Este bloque sale aunque esté vacío: «ninguna» es información —el
              bot va solo— y un bloque que desaparece deja dudando si es que no
              hay nada o es que la app no lo está enseñando. */}
          <Grupo titulo="Te están esperando" cuantos={hablando.length} tono="alerta">
            {hablando.length === 0 ? (
              <Text style={styles.grupoVacio}>Ninguna. El bot va solo.</Text>
            ) : (
              hablando.map((item) => <TarjetaConversacion key={item.id} item={item} />)
            )}
          </Grupo>

          {usuario?.centro.citas !== false ? (
            <Grupo titulo="Citas por confirmar" cuantos={citas.length}>
              {citas.length === 0 ? (
                <Text style={styles.grupoVacio}>Ninguna sin confirmar.</Text>
              ) : (
                citas.map((item) => (
                  <TarjetaCita
                    key={item.id}
                    item={item}
                    ocupado={decidiendo === item.id}
                    onConfirmar={() => decidir(item.id, true)}
                    onRechazar={() => decidir(item.id, false)}
                  />
                ))
              )}
            </Grupo>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

/** Un bloque de la cola, con su título y cuántos hay. */
function Grupo({
  titulo, cuantos, tono = 'normal', children,
}: {
  titulo: string;
  cuantos: number;
  tono?: 'normal' | 'alerta';
  children: React.ReactNode;
}) {
  return (
    <View style={styles.grupo}>
      <View style={styles.grupoCabecera}>
        <Text style={[styles.grupoTitulo, tono === 'alerta' && { color: colors.warning }]}>
          {titulo.toUpperCase()}
        </Text>
        <Text style={styles.grupoCuenta}>{cuantos}</Text>
      </View>
      <View style={styles.lista}>{children}</View>
    </View>
  );
}

/**
 * Ir a hablarlo, sin decidir todavía.
 *
 * Se abre la conversación **de dentro de la app**, que es donde está el hilo
 * con su contexto y donde se puede quitar al bot de en medio. Mandaba a
 * WhatsApp por el número, y eso era salirse de la app para acabar escribiendo
 * en el sitio donde no se ve quién está contestando.
 *
 * Si esa cita no salió de ninguna conversación no hay nada que abrir y el botón
 * no se dibuja: un botón que no lleva a ningún sitio es peor que no tenerlo.
 */
function BotonHablar({ chat }: { chat: string }) {
  if (!chat) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir la conversación"
      onPress={() => router.push(`/chat/${chat}`)}
      style={({ pressed }) => [styles.redondo, styles.redondoHablar, pressed && { opacity: 0.7 }]}>
      <Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.brandDark} />
    </Pressable>
  );
}

/** Cuánto lleva esperando, dicho entero.
 *
 * Antes salía de quitarle el «hace» a la fecha relativa, y eso producía
 * «esperando ahora mismo» y «esperando ayer», que no se dicen.
 */
function cuantoLleva(minutos: number, compacta: boolean) {
  if (minutos < 1) return compacta ? 'ahora' : 'acaba de llegar';
  if (minutos < 60) return compacta ? `${minutos} min` : `esperando ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return compacta ? `${horas} h` : `esperando ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return compacta ? 'ayer' : 'esperando desde ayer';
  return compacta ? `${dias} días` : `esperando ${dias} días`;
}

/**
 * En rojo a partir de media hora, que es lo que duele.
 *
 * La versión corta es para la tarjeta de cita, que lleva tres botones al lado:
 * con la frase entera no cabía y se quedaba en «esperan…», que no dice nada.
 */
function Espera({ desde, compacta = false }: { desde: string; compacta?: boolean }) {
  if (!desde) return null;
  const minutos = minutosDesde(desde);
  const tarde = minutos >= 30;
  return (
    <View style={styles.espera}>
      <Ionicons name="time-outline" size={14} color={tarde ? colors.danger : colors.faint} />
      <Text
        style={[styles.esperaTexto, tarde && { color: colors.danger, fontWeight: '700' }]}
        numberOfLines={1}>
        {cuantoLleva(minutos, compacta)}
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
          {/* Con el icono, porque lo que se abre es la conversación de
              WhatsApp de esa persona y no una pantalla cualquiera. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Entrar en la conversación de ${item.persona}`}
            onPress={() => router.push(`/chat/${item.id}`)}
            style={({ pressed }) => [styles.entrar, pressed && { opacity: 0.8 }]}>
            <Ionicons name="logo-whatsapp" size={17} color="#fff" />
            <Text style={styles.entrarTexto}>Entrar</Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

function TarjetaCita({
  item, ocupado, onConfirmar, onRechazar,
}: {
  item: Extract<Pendiente, { tipo: 'cita' }>;
  ocupado: boolean;
  onConfirmar: () => void;
  onRechazar: () => void;
}) {
  const { cita } = item;
  const [preguntando, setPreguntando] = useState(false);
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

        {/* Rechazar se pregunta antes, y aquí mismo: le va a llegar un «no»
            por WhatsApp a una persona y eso no se deshace. La pregunta
            sustituye a la fila de botones en vez de taparla con un aviso del
            sistema, para que se siga viendo de qué cita se está hablando. */}
        {preguntando ? (
          <View style={styles.confirmaRechazo}>
            <Text style={styles.confirmaTexto}>
              ¿Rechazar esta cita? Se le dirá por WhatsApp.
            </Text>
            {/* La salida de en medio, que muchas veces es la buena: antes de
                decirle que no, preguntarle si le viene otro día. Va como enlace
                y no como tercer botón para que no compita con la decisión. */}
            {item.chat ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/chat/${item.chat}`)}
                style={({ pressed }) => [styles.hablarAntes, pressed && { opacity: 0.6 }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.brandDark} />
                <Text style={styles.hablarAntesTexto}>Hablar con {item.persona.split(' ')[0]} antes</Text>
              </Pressable>
            ) : null}
            <View style={styles.confirmaBotones}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPreguntando(false)}
                style={({ pressed }) => [styles.noGracias, pressed && { opacity: 0.7 }]}>
                <Text style={styles.noGraciasTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Confirmar que se rechaza la cita de ${item.persona}`}
                disabled={ocupado}
                onPress={() => { setPreguntando(false); onRechazar(); }}
                style={({ pressed }) => [styles.siRechazar, pressed && { opacity: 0.8 }]}>
                <Text style={styles.siRechazarTexto}>Sí, rechazar</Text>
              </Pressable>
            </View>
          </View>
        ) : (
        <View style={styles.pie}>
          <Espera desde={item.desde} compacta />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Rechazar la cita de ${item.persona}`}
            disabled={ocupado}
            onPress={() => setPreguntando(true)}
            style={({ pressed }) => [
              styles.redondo, styles.redondoNo, pressed && { opacity: 0.7 }, ocupado && { opacity: 0.4 },
            ]}>
            <Ionicons name="close" size={19} color={colors.danger} />
          </Pressable>
          <BotonHablar chat={item.chat} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Confirmar la cita de ${item.persona}`}
            disabled={ocupado}
            onPress={onConfirmar}
            style={({ pressed }) => [styles.confirmar, pressed && { opacity: 0.8 }, ocupado && { opacity: 0.6 }]}>
            {ocupado ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="checkmark" size={21} color="#fff" />
            )}
            <Text style={styles.confirmarTexto}>Confirmar</Text>
          </Pressable>
        </View>
        )}
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
  // La espera y los botones comparten línea: son la pregunta y la respuesta.
  // Con envoltura, porque tres botones y «esperando desde ayer» no siempre
  // caben en 375 puntos y es mejor que bajen a que se recorten.
  pie: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  entrar: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    minHeight: 38, paddingHorizontal: space.lg,
    borderRadius: radius.md, backgroundColor: colors.brand,
  },
  entrarTexto: { fontSize: 15, fontWeight: '700', color: '#fff' },
  confirmar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    minHeight: 42, paddingHorizontal: space.md + 2,
    // El verde de la marca y no el de «correcto»: es el mismo botón que
    // «Entrar», y dos verdes distintos en la misma pantalla se leen como
    // dos cosas distintas cuando son la misma.
    borderRadius: radius.md, backgroundColor: colors.brand,
  },
  confirmarTexto: { fontSize: 15, fontWeight: '800', color: '#fff' },
  redondo: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  redondoNo: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft },
  redondoHablar: { backgroundColor: colors.brandSoft, borderColor: colors.brandSoft },
  confirmaRechazo: {
    gap: space.sm, backgroundColor: colors.dangerSoft,
    borderRadius: radius.md, padding: space.md,
  },
  confirmaTexto: { fontSize: 14, color: colors.danger, fontWeight: '600', lineHeight: 19 },
  confirmaBotones: { flexDirection: 'row', gap: space.sm },
  hablarAntes: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  hablarAntesTexto: {
    fontSize: 14, fontWeight: '700', color: colors.brandDark, textDecorationLine: 'underline',
  },
  noGracias: {
    flex: 1, minHeight: 40, borderRadius: radius.md, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  noGraciasTexto: { fontSize: 15, fontWeight: '700', color: colors.text },
  siRechazar: {
    flex: 1, minHeight: 40, borderRadius: radius.md, backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  siRechazarTexto: { fontSize: 15, fontWeight: '800', color: '#fff' },
  grupo: { gap: space.sm },
  grupoCabecera: {
    flexDirection: 'row', alignItems: 'baseline', gap: space.sm, paddingHorizontal: space.xs,
  },
  grupoTitulo: {
    flex: 1, fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.5,
  },
  grupoCuenta: { fontSize: 13, fontWeight: '800', color: colors.faint },
  grupoVacio: {
    fontSize: 14, color: colors.muted, paddingVertical: space.sm,
    paddingHorizontal: space.xs,
  },
  espera: { flex: 1, minWidth: 54, flexDirection: 'row', alignItems: 'center', gap: 5 },
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
