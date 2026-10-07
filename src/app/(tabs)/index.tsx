import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Boton, Card, Chip, EmptyState, Encabezado } from '@/components/ui';
import { dayTitle, hora, timeAgo } from '@/lib/format';
import { CENTRO, PENDIENTES, type Pendiente } from '@/lib/mock';
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
  const [cola, setCola] = useState<Pendiente[]>(PENDIENTES);

  function resolver(id: string) {
    setCola((actual) => actual.filter((item) => item.id !== id));
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + space.lg }]}
      showsVerticalScrollIndicator={false}>
      <Encabezado titulo="Pendiente" coletilla={CENTRO} />

      {cola.length === 0 ? (
        <Card style={styles.tranquilo}>
          <View style={styles.tranquiloIcono}>
            <Ionicons name="checkmark-done" size={26} color={colors.brand} />
          </View>
          <EmptyState
            title="Nada que decidir"
            text="El bot está llevando las conversaciones. Te avisamos en cuanto alguien pida cita o quiera hablar con una persona."
          />
        </Card>
      ) : (
        <>
          <Text style={styles.resumen}>
            {cola.length === 1 ? '1 cosa espera tu respuesta' : `${cola.length} cosas esperan tu respuesta`}
          </Text>
          <View style={styles.lista}>
            {cola.map((item) =>
              item.tipo === 'agente' ? (
                <TarjetaAgente key={item.id} item={item} onResolver={() => resolver(item.id)} />
              ) : (
                <TarjetaCita key={item.id} item={item} onResolver={() => resolver(item.id)} />
              ),
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

/** Cuánto lleva esperando. En rojo a partir de media hora, que es lo que duele. */
function Espera({ desde }: { desde: Date }) {
  const minutos = Math.floor((Date.now() - desde.getTime()) / 60_000);
  const tarde = minutos >= 30;
  return (
    <View style={styles.espera}>
      <Ionicons name="time-outline" size={14} color={tarde ? colors.danger : colors.faint} />
      <Text style={[styles.esperaTexto, tarde && { color: colors.danger, fontWeight: '700' }]}>
        esperando {timeAgo(desde).replace('hace ', '')}
      </Text>
    </View>
  );
}

function TarjetaAgente({ item, onResolver }: { item: Extract<Pendiente, { tipo: 'agente' }>; onResolver: () => void }) {
  return (
    <Card style={styles.tarjeta}>
      <View style={[styles.franja, { backgroundColor: colors.warning }]} />
      <View style={styles.cuerpo}>
        <View style={styles.cabecera}>
          <Avatar nombre={item.persona} tono="alerta" />
          <View style={styles.cabeceraTexto}>
            <Text style={styles.persona}>{item.persona}</Text>
            <Chip label="Quiere hablar contigo" tone="warning" />
          </View>
        </View>

        {/* Lo que dijo, literal. Es lo único que te deja decidir si corre prisa. */}
        <Text style={styles.cita}>«{item.mensaje}»</Text>

        <Espera desde={item.desde} />

        <Boton
          titulo="Entrar en la conversación"
          onPress={() => {
            onResolver();
            router.push('/chat/c1');
          }}
        />
      </View>
    </Card>
  );
}

function TarjetaCita({ item, onResolver }: { item: Extract<Pendiente, { tipo: 'cita' }>; onResolver: () => void }) {
  return (
    <Card style={styles.tarjeta}>
      <View style={[styles.franja, { backgroundColor: item.hueco ? colors.brand : colors.danger }]} />
      <View style={styles.cuerpo}>
        <View style={styles.cabecera}>
          <Avatar nombre={item.persona} />
          <View style={styles.cabeceraTexto}>
            <Text style={styles.persona}>{item.persona}</Text>
            <Chip label="Pide cita" tone="brand" />
          </View>
        </View>

        <View style={styles.hueco}>
          <Text style={styles.cuando}>
            {dayTitle(item.cuando)} · {hora(item.cuando)}
          </Text>
          <Text style={styles.detalle}>
            {item.tratamiento} · {item.profesional}
          </Text>
          {item.hueco ? null : (
            <View style={styles.ocupado}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.ocupadoTexto}>Ese hueco ya está cogido</Text>
            </View>
          )}
        </View>

        <Espera desde={item.desde} />

        {item.hueco ? (
          <View style={styles.botones}>
            <Boton titulo="Confirmar" onPress={onResolver} style={styles.botonAncho} />
            <Boton titulo="Otra hora" variante="secundario" onPress={onResolver} style={styles.botonAncho} />
          </View>
        ) : (
          <Boton titulo="Proponerle otra hora" onPress={onResolver} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
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
  ocupado: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.xs },
  ocupadoTexto: { fontSize: 14, fontWeight: '700', color: colors.danger },
  espera: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  esperaTexto: { fontSize: 13, color: colors.faint },
  botones: { flexDirection: 'row', gap: space.sm },
  botonAncho: { flex: 1 },
  tranquilo: { alignItems: 'center', gap: space.sm },
  tranquiloIcono: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center', marginTop: space.sm,
  },
});
