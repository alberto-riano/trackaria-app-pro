import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Calendario } from '@/components/calendario';
import { Insignia, Plazas } from '@/components/clase-ui';
import { TiraSemanas } from '@/components/tira-semanas';
import { Chip, EmptyState, Encabezado } from '@/components/ui';
import { endpoints, type Clase } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { comoFecha, dayTitle, enIso } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Las clases del día.
 *
 * Esta pestaña existe por lo que se hace con alguien delante: «apúntame al de
 * las siete», «¿queda sitio el jueves?». Por eso lo que más pesa en cada fila
 * son las plazas, y por eso se entra en la clase de un toque.
 *
 * Crear clases, cambiar horarios o asignar instructores no está aquí a
 * propósito: eso mueve la semana entera de un centro y se decide en el panel.
 */
export default function ClasesScreen() {
  const insets = useSafeAreaInsets();
  const { usuario } = useSession();
  const hoy = enIso(new Date());
  const [dia, setDia] = useState(hoy);
  const [calendario, setCalendario] = useState(false);

  const { datos, error, refrescando, refrescar } = useDatos(
    useCallback((token: string) => endpoints.clases(token, dia), [dia]),
  );

  // Hasta que no llega el día pedido, se espera: enseñar las clases de ayer
  // mientras tanto es enseñar algo falso en la pantalla con la que se apunta.
  const clases = datos && datos.fecha === dia ? datos.clases : null;

  const semana = useMemo(
    () =>
      (datos?.semana ?? []).map((item) => ({
        fecha: item.fecha,
        cuantas: item.clases,
        // El aviso es «hoy vas a tener que decir que no»: un día con alguna
        // clase llena es un día que se mira antes de prometer nada.
        aviso: item.completas > 0,
      })),
    [datos?.semana],
  );

  const diasConClases = useCallback(
    (token: string, desde: string, hasta: string) =>
      endpoints.cargaDeClases(token, desde, hasta).then(({ carga }) => carga.map((item) => item.fecha)),
    [],
  );

  const libres = (clases ?? []).reduce((suma, clase) => suma + (clase.cancelada ? 0 : clase.libres), 0);

  return (
    <>
      {/* Fuera del scroll, igual que la agenda: dentro, el deslizamiento de la
          tira competía con el de la lista y la semana no se movía. */}
      <View style={[styles.cabecera, { paddingTop: insets.top + space.lg }]}>
        <Encabezado
          titulo={dayTitle(comoFecha(dia))}
          coletilla={usuario?.centro.nombre}
          contenido
          accion={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Elegir un día"
              onPress={() => setCalendario(true)}
              style={({ pressed }) => [styles.boton, pressed && { opacity: 0.7 }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.brandDark} />
            </Pressable>
          }
        />

        <TiraSemanas elegido={dia} hoy={hoy} carga={semana} onElegir={setDia} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.brand} />}>
        {error ? (
          <View style={styles.error} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorTexto}>{error}</Text>
          </View>
        ) : null}

        {clases === null ? (
          <ActivityIndicator color={colors.brand} style={styles.cargando} />
        ) : clases.length === 0 ? (
          <EmptyState
            title="Ninguna clase este día"
            text="Los horarios de tus clases se ponen desde el panel."
          />
        ) : (
          <>
            {/* Cuántas hay y cuántos huecos quedan en todo el día: es lo que se
                contesta por teléfono antes de mirar clase por clase. */}
            <Text style={styles.resumen}>
              {clases.length === 1 ? '1 clase' : `${clases.length} clases`}
              <Text style={styles.huecos}>
                {'  ·  '}
                {libres === 0 ? 'sin huecos' : libres === 1 ? '1 hueco libre' : `${libres} huecos libres`}
              </Text>
            </Text>

            <View style={styles.lista}>
              {clases.map((clase) => (
                <Fila key={clase.id} clase={clase} />
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
        diasConAlgo={diasConClases}
      />
    </>
  );
}

function Fila({ clase }: { clase: Clase }) {
  const apagada = clase.cancelada || clase.empezada;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${clase.hora}, ${clase.nombre}, ${clase.ocupadas} de ${clase.plazas} plazas`}
      onPress={() => router.push(`/clase/${clase.id}`)}
      style={({ pressed }) => [styles.fila, apagada && styles.filaApagada, pressed && { opacity: 0.7 }]}>
      <View style={styles.columnaHora}>
        <Text style={styles.hora} numberOfLines={1}>{clase.hora}</Text>
        <Text style={styles.duracion}>{clase.minutos}′</Text>
      </View>

      <View style={styles.tarjeta}>
        <View style={[styles.franja, { backgroundColor: clase.color || colors.brand }]} />
        <Insignia nombre={clase.nombre} color={clase.color} imagen={clase.imagen} />
        <View style={styles.texto}>
          <Text style={styles.nombre} numberOfLines={1}>{clase.nombre}</Text>
          {clase.instructor || clase.sala ? (
            <Text style={styles.detalle} numberOfLines={1}>
              {[clase.instructor, clase.sala].filter(Boolean).join('  ·  ')}
            </Text>
          ) : null}
          {clase.cancelada ? (
            <View style={styles.chips}>
              <Chip label="Cancelada" tone="danger" />
            </View>
          ) : (
            <Plazas ocupadas={clase.ocupadas} plazas={clase.plazas} />
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cabecera: { paddingHorizontal: space.lg, backgroundColor: colors.background },
  contenido: { padding: space.lg, paddingBottom: space.xxl },
  cargando: { marginTop: space.xxl },
  boton: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center', marginTop: space.sm,
  },
  resumen: { fontSize: 13, fontWeight: '600', color: colors.faint, marginBottom: space.md },
  huecos: { color: colors.muted },
  lista: { gap: space.sm },
  fila: { flexDirection: 'row', gap: space.md, alignItems: 'stretch' },
  filaApagada: { opacity: 0.55 },
  columnaHora: { width: 58, paddingTop: space.md, alignItems: 'flex-end' },
  hora: { fontSize: 15, fontWeight: '800', color: colors.text },
  duracion: { fontSize: 11, color: colors.faint },
  tarjeta: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: space.md, paddingLeft: 0, overflow: 'hidden',
  },
  franja: { width: 4, alignSelf: 'stretch', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  texto: { flex: 1, gap: 3 },
  nombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  detalle: { fontSize: 13, color: colors.muted },
  chips: { flexDirection: 'row', marginTop: space.xs },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md, marginTop: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
