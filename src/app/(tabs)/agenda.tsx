import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Calendario } from '@/components/calendario';
import { TiraSemanas } from '@/components/tira-semanas';
import { Chip, EmptyState, Encabezado } from '@/components/ui';
import { endpoints, type Cita } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { comoFecha, dayTitle, enIso } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * La agenda.
 *
 * Aquí no se crea ni se mueve nada: mover una cita toca el calendario de Google,
 * avisa al paciente y puede chocar con otra. Eso se hace en el panel, con sitio
 * para ver las consecuencias. Esto responde a «¿quién viene y cuándo?».
 */
export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const { usuario } = useSession();
  const hoy = enIso(new Date());
  const [dia, setDia] = useState(hoy);
  const [calendario, setCalendario] = useState(false);
  const [profesional, setProfesional] = useState('');

  const { datos, error, refrescando, refrescar } = useDatos(
    useCallback((token: string) => endpoints.agenda(token, dia), [dia]),
  );

  const todas = datos?.citas ?? null;
  const esHoy = dia === hoy;
  const ahora = new Date().toTimeString().slice(0, 5);

  // Las opciones salen de quien tiene citas ese día. Se conserva la elegida
  // aunque hoy no trabaje: si no, al cambiar de día el filtro se borraría solo y
  // parecería que la app lo ha decidido por ti.
  const profesionales = useMemo(() => {
    const nombres = [...new Set((todas ?? []).map((cita) => cita.profesional).filter(Boolean))];
    if (profesional && !nombres.includes(profesional)) nombres.push(profesional);
    return nombres.sort();
  }, [todas, profesional]);

  const citas = useMemo(
    () => (todas ?? []).filter((cita) => !profesional || cita.profesional === profesional),
    [todas, profesional],
  );

  const sinConfirmar = citas.filter((cita) => cita.estado === 'requested').length;
  const siguiente = esHoy ? citas.find((cita) => cita.hora >= ahora) : citas[0];

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.contenido, { paddingTop: insets.top + space.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.brand} />}>
        <Encabezado
          titulo={dayTitle(comoFecha(dia))}
          coletilla={usuario?.centro.nombre}
          // Una fecha larga como «Jueves 15 de octubre» a tamaño de titular
          // ocupaba dos líneas y media pantalla antes de enseñar una sola cita.
          contenido

          accion={
            <View style={styles.acciones}>
              {!esHoy ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Volver a hoy"
                  onPress={() => setDia(hoy)}
                  style={({ pressed }) => [styles.boton, pressed && { opacity: 0.7 }]}>
                  <Ionicons name="today-outline" size={20} color={colors.brandDark} />
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Elegir un día"
                onPress={() => setCalendario(true)}
                style={({ pressed }) => [styles.boton, pressed && { opacity: 0.7 }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.brandDark} />
              </Pressable>
            </View>
          }
        />

        <TiraSemanas elegido={dia} hoy={hoy} carga={datos?.semana ?? []} onElegir={setDia} />

        {profesionales.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtros}>
            <Filtro etiqueta="Todos" activo={!profesional} onPress={() => setProfesional('')} />
            {profesionales.map((nombre) => (
              <Filtro
                key={nombre}
                etiqueta={nombre}
                activo={profesional === nombre}
                onPress={() => setProfesional(profesional === nombre ? '' : nombre)}
              />
            ))}
          </ScrollView>
        ) : null}

        {error ? (
          <View style={styles.error} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorTexto}>{error}</Text>
          </View>
        ) : null}

        {todas === null ? (
          <ActivityIndicator color={colors.brand} style={styles.cargando} />
        ) : citas.length === 0 ? (
          <EmptyState
            title={profesional ? `${profesional} no tiene nada este día` : 'Ningún paciente este día'}
            text={profesional ? 'Quita el filtro para ver el resto de la agenda.' : 'Cuando se reserve una cita, aparecerá aquí.'}
          />
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

      <Calendario
        visible={calendario}
        elegido={dia}
        hoy={hoy}
        onElegir={setDia}
        onClose={() => setCalendario(false)}
      />
    </>
  );
}

function Filtro({ etiqueta, activo, onPress }: { etiqueta: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={({ pressed }) => [styles.filtro, activo && styles.filtroActivo, pressed && { opacity: 0.7 }]}>
      <Text style={[styles.filtroTexto, activo && styles.filtroTextoActivo]} numberOfLines={1}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

function Fila({ cita, pasada }: { cita: Cita; pasada: boolean }) {
  return (
    <View style={[styles.fila, pasada && styles.filaPasada]}>
      {/* La hora fuera de la tarjeta y en una línea: la columna se lee sola de
          arriba abajo y se ve de un vistazo dónde están los huecos. */}
      <View style={styles.columnaHora}>
        <Text style={[styles.hora, pasada && styles.textoPasado]} numberOfLines={1}>{cita.hora}</Text>
        <Text style={styles.duracion}>{cita.minutos}′</Text>
      </View>

      <View style={styles.tarjeta}>
        <View style={[styles.franja, { backgroundColor: cita.color || colors.brand }]} />
        <View style={styles.texto}>
          <Text style={[styles.persona, pasada && styles.textoPasado]} numberOfLines={1}>
            {cita.persona}
          </Text>
          {cita.profesional ? (
            <Text style={styles.profesional} numberOfLines={1}>{cita.profesional}</Text>
          ) : null}
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
  acciones: { flexDirection: 'row', gap: space.xs, marginTop: space.sm },
  boton: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  filtros: { gap: space.xs, paddingVertical: space.md, paddingRight: space.lg },
  filtro: {
    paddingHorizontal: space.md, paddingVertical: 5, borderRadius: radius.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  filtroActivo: { backgroundColor: colors.text, borderColor: colors.text },
  filtroTexto: { fontSize: 13, fontWeight: '700', color: colors.muted },
  filtroTextoActivo: { color: '#fff' },
  resumen: { marginTop: space.md, marginBottom: space.lg, gap: 2 },
  resumenTexto: { fontSize: 16, fontWeight: '700', color: colors.text },
  siguiente: { fontSize: 14, color: colors.muted },
  lista: { gap: space.sm },
  fila: { flexDirection: 'row', gap: space.md, alignItems: 'stretch' },
  filaPasada: { opacity: 0.55 },
  columnaHora: { width: 58, paddingTop: space.md, alignItems: 'flex-end' },
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
  profesional: { fontSize: 13, color: colors.muted },
  chips: { flexDirection: 'row', marginTop: space.xs },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md, marginTop: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
