import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, EmptyState, Encabezado } from '@/components/ui';
import { endpoints, type Cita, type DiaDeLaSemana } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { comoFecha, dayTitle, enIso } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * La agenda, con la semana a la vista.
 *
 * Antes solo había un día y dos flechas, y para saber si el jueves estaba lleno
 * había que ir pasando días a ciegas. La tira de arriba enseña la semana entera
 * con cuánto hay cada día, que es la pregunta que de verdad se hace quien abre
 * esto: dónde tengo hueco y dónde no.
 *
 * Aquí no se crea ni se mueve nada: mover una cita toca el calendario de Google,
 * avisa al paciente y puede chocar con otra. Eso se hace en el panel, con sitio
 * para ver las consecuencias.
 */
export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const { usuario } = useSession();
  // El día que se mira, como desplazamiento respecto a hoy: así «Hoy» siempre es
  // hoy aunque la app lleve abierta desde ayer.
  const [salto, setSalto] = useState(0);
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + salto);
  const iso = enIso(fecha);

  const { datos, error, refrescando, refrescar } = useDatos(
    useCallback((token: string) => endpoints.agenda(token, iso), [iso]),
  );

  const citas = datos?.citas ?? null;
  const semana = datos?.semana ?? [];
  const hoyIso = enIso(new Date());
  const ahora = new Date().toTimeString().slice(0, 5);
  const esHoy = iso === hoyIso;
  const sinConfirmar = (citas ?? []).filter((cita) => cita.estado === 'requested').length;
  const siguiente = esHoy ? (citas ?? []).find((cita) => cita.hora >= ahora) : (citas ?? [])[0];

  function irA(nuevoIso: string) {
    const destino = comoFecha(nuevoIso);
    const hoy = comoFecha(hoyIso);
    setSalto(Math.round((destino.getTime() - hoy.getTime()) / 86_400_000));
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + space.lg }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.brand} />}>
      <Encabezado titulo={dayTitle(comoFecha(iso))} coletilla={usuario?.centro.nombre} />

      <View style={styles.navegacion}>
        <Flecha icono="chevron-back" etiqueta="La semana anterior" onPress={() => setSalto((d) => d - 7)} />
        <Tira dias={semana} elegido={iso} hoy={hoyIso} onElegir={irA} />
        <Flecha icono="chevron-forward" etiqueta="La semana siguiente" onPress={() => setSalto((d) => d + 7)} />
      </View>

      {!esHoy ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setSalto(0)}
          style={({ pressed }) => [styles.volverHoy, pressed && { opacity: 0.7 }]}>
          <Ionicons name="today-outline" size={15} color={colors.brandDark} />
          <Text style={styles.volverHoyTexto}>Volver a hoy</Text>
        </Pressable>
      ) : null}

      {error ? (
        <View style={styles.error} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorTexto}>{error}</Text>
        </View>
      ) : null}

      {citas === null ? (
        <ActivityIndicator color={colors.brand} style={styles.cargando} />
      ) : citas.length === 0 ? (
        <EmptyState title="Ningún paciente este día" text="Cuando se reserve una cita, aparecerá aquí." />
      ) : (
        <>
          <View style={styles.resumen}>
            <Text style={styles.resumenTexto}>
              {citas.length === 1 ? '1 cita' : `${citas.length} citas`}
              {sinConfirmar > 0 ? ` · ${sinConfirmar} sin confirmar` : ''}
            </Text>
            {siguiente ? (
              <Text style={styles.siguiente}>
                {esHoy ? 'La siguiente' : 'La primera'}, {siguiente.hora} · {siguiente.persona}
              </Text>
            ) : (
              <Text style={styles.siguiente}>No queda nada por hoy.</Text>
            )}
          </View>

          <View style={styles.lista}>
            {citas.map((cita) => (
              <Fila key={cita.id} cita={cita} pasada={esHoy && cita.hora < ahora} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

/** La semana: letra, número y cuánto hay ese día. */
function Tira({
  dias, elegido, hoy, onElegir,
}: {
  dias: DiaDeLaSemana[];
  elegido: string;
  hoy: string;
  onElegir: (iso: string) => void;
}) {
  return (
    <View style={styles.tira}>
      {dias.map((dia, indice) => {
        const activo = dia.fecha === elegido;
        const esHoy = dia.fecha === hoy;
        return (
          <Pressable
            key={dia.fecha}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={`${dayTitle(comoFecha(dia.fecha))}, ${dia.citas} citas`}
            onPress={() => onElegir(dia.fecha)}
            style={({ pressed }) => [styles.dia, activo && styles.diaElegido, pressed && { opacity: 0.7 }]}>
            <Text style={[styles.diaLetra, activo && styles.diaTextoElegido]}>{LETRAS[indice]}</Text>
            <Text style={[styles.diaNumero, activo && styles.diaTextoElegido, esHoy && !activo && styles.diaHoy]}>
              {comoFecha(dia.fecha).getDate()}
            </Text>
            {/* Cuánto hay, sin números: lo que se mira de reojo es si el día está
                lleno o vacío, no si tiene cinco citas o seis. */}
            <View style={styles.puntos}>
              {dia.citas === 0 ? (
                <View style={styles.sinNada} />
              ) : (
                <View
                  style={[
                    styles.punto,
                    { backgroundColor: activo ? '#fff' : colors.brand },
                    dia.sin_confirmar > 0 && !activo && { backgroundColor: colors.warning },
                    dia.citas >= 5 && styles.puntoLleno,
                  ]}
                />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Flecha({ icono, etiqueta, onPress }: { icono: 'chevron-back' | 'chevron-forward'; etiqueta: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={({ pressed }) => [styles.flecha, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icono} size={18} color={colors.muted} />
    </Pressable>
  );
}

function Fila({ cita, pasada }: { cita: Cita; pasada: boolean }) {
  return (
    <View style={[styles.fila, pasada && styles.filaPasada]}>
      {/* La hora fuera de la tarjeta, alineada: así la columna de horas se lee
          sola de arriba abajo y se ve de un vistazo dónde están los huecos. */}
      <View style={styles.columnaHora}>
        <Text style={[styles.hora, pasada && styles.textoPasado]}>{cita.hora}</Text>
        <Text style={styles.duracion}>{cita.minutos}′</Text>
      </View>

      <View style={styles.tarjeta}>
        <View style={[styles.franja, { backgroundColor: cita.color || colors.brand }]} />
        <View style={styles.texto}>
          <Text style={[styles.persona, pasada && styles.textoPasado]} numberOfLines={1}>
            {cita.persona}
          </Text>
          <Text style={styles.detalle} numberOfLines={1}>
            {[cita.tratamiento, cita.profesional].filter(Boolean).join(' · ')}
          </Text>
          {cita.estado === 'requested' ? (
            <View style={styles.chips}>
              <Chip label="Sin confirmar" tone="warning" />
            </View>
          ) : null}
        </View>
        {pasada ? <Ionicons name="checkmark" size={18} color={colors.faint} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, paddingBottom: space.xxl },
  cargando: { marginTop: space.xxl },
  navegacion: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.md },
  flecha: { width: 28, height: 56, alignItems: 'center', justifyContent: 'center' },
  tira: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 2 },
  dia: {
    flex: 1, alignItems: 'center', gap: 2, paddingVertical: space.sm,
    borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  diaElegido: { backgroundColor: colors.brand, borderColor: colors.brand },
  diaLetra: { fontSize: 11, fontWeight: '700', color: colors.faint },
  diaNumero: { fontSize: 16, fontWeight: '800', color: colors.text },
  diaTextoElegido: { color: '#fff' },
  diaHoy: { color: colors.brand },
  puntos: { height: 8, justifyContent: 'center' },
  punto: { width: 5, height: 5, borderRadius: 3 },
  puntoLleno: { width: 14 },
  sinNada: { width: 5, height: 5 },
  volverHoy: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    alignSelf: 'center', paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: radius.pill, backgroundColor: colors.brandSoft, marginBottom: space.md,
  },
  volverHoyTexto: { fontSize: 13, fontWeight: '700', color: colors.brandDark },
  resumen: { marginBottom: space.lg, gap: 2 },
  resumenTexto: { fontSize: 16, fontWeight: '700', color: colors.text },
  siguiente: { fontSize: 14, color: colors.muted },
  lista: { gap: space.sm },
  fila: { flexDirection: 'row', gap: space.md, alignItems: 'stretch' },
  filaPasada: { opacity: 0.55 },
  columnaHora: { width: 52, paddingTop: space.md, alignItems: 'flex-end' },
  hora: { fontSize: 15, fontWeight: '800', color: colors.text },
  duracion: { fontSize: 11, color: colors.faint },
  textoPasado: { color: colors.muted },
  tarjeta: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: space.md, paddingLeft: 0, overflow: 'hidden',
  },
  franja: { width: 4, alignSelf: 'stretch', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  texto: { flex: 1, gap: 2 },
  persona: { fontSize: 16, fontWeight: '700', color: colors.text },
  detalle: { fontSize: 13, color: colors.muted },
  chips: { flexDirection: 'row', marginTop: space.xs },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md, marginBottom: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
