import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { BottomSheet } from '@/components/overlay';
import { Avatar, Boton } from '@/components/ui';
import { ApiError, endpoints, type AlumnoBuscado, type ClaseDetalle } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/** Lo que se tarda en dejar de teclear antes de preguntar al servidor. */
const ESPERA = 280;

/**
 * Apuntar a alguien a una clase, en dos pasos.
 *
 * Primero quién —se busca por nombre o por teléfono, porque quien pregunta en
 * el mostrador dice una cosa o la otra— y después con qué paga. El segundo paso
 * no se salta aunque solo haya una opción: gastarle el bono que no era se
 * arregla a mano y con el alumno enfadado.
 *
 * Quien ya está dentro sale marcado y no se puede elegir. Antes se podía, y el
 * servidor contestaba «ya está apuntado»: un error evitable es un error que no
 * hay que enseñar.
 */
export function Apuntar({
  visible, clase, onClose, onApuntado,
}: {
  visible: boolean;
  clase: ClaseDetalle;
  onClose: () => void;
  onApuntado: (clase: ClaseDetalle) => void;
}) {
  const { token } = useSession();
  const [busca, setBusca] = useState('');
  const [alumnos, setAlumnos] = useState<AlumnoBuscado[] | null>(null);
  const [elegido, setElegido] = useState<AlumnoBuscado | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState('');

  // Cada apertura empieza limpia: la hoja se abre para apuntar a alguien, no
  // para seguir donde se quedó la última vez.
  useEffect(() => {
    if (!visible) return;
    setBusca('');
    setAlumnos(null);
    setElegido(null);
    setFallo('');
  }, [visible]);

  useEffect(() => {
    if (!visible || !token || elegido) return;
    let vigente = true;
    const reloj = setTimeout(() => {
      endpoints
        .alumnos(token, busca, clase.id)
        .then(({ alumnos: encontrados }) => { if (vigente) setAlumnos(encontrados); })
        .catch(() => { if (vigente) setAlumnos([]); });
    }, ESPERA);
    return () => { vigente = false; clearTimeout(reloj); };
  }, [visible, token, busca, clase.id, elegido]);

  async function apuntar(pago?: { bono?: string; mensualidad?: string }) {
    if (!token || !elegido || guardando) return;
    setGuardando(true);
    setFallo('');
    try {
      const { clase: actualizada } = await endpoints.apuntar(token, clase.id, elegido.id, pago);
      onApuntado(actualizada);
      onClose();
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido apuntar.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} cerrarLabel="Cerrar">
      {elegido ? (
        <ComoPaga
          alumno={elegido}
          clase={clase}
          guardando={guardando}
          fallo={fallo}
          onVolver={() => { setElegido(null); setFallo(''); }}
          onElegir={apuntar}
        />
      ) : (
        <Quien
          busca={busca}
          alumnos={alumnos}
          libres={clase.libres}
          onBuscar={setBusca}
          onElegir={setElegido}
        />
      )}
    </BottomSheet>
  );
}

function Quien({
  busca, alumnos, libres, onBuscar, onElegir,
}: {
  busca: string;
  alumnos: AlumnoBuscado[] | null;
  libres: number;
  onBuscar: (texto: string) => void;
  onElegir: (alumno: AlumnoBuscado) => void;
}) {
  return (
    <>
      <Text style={styles.titulo}>Apuntar a alguien</Text>
      <Text style={styles.coletilla}>
        {libres === 0
          ? 'La clase está completa: quien entre ahora ocupa una plaza de más.'
          : libres === 1
            ? 'Queda 1 plaza.'
            : `Quedan ${libres} plazas.`}
      </Text>

      <View style={styles.buscador}>
        <Ionicons name="search" size={18} color={colors.faint} />
        <TextInput
          value={busca}
          onChangeText={onBuscar}
          placeholder="Nombre o teléfono"
          placeholderTextColor={colors.faint}
          style={styles.campo}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
        />
        {busca ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Borrar" onPress={() => onBuscar('')}>
            <Ionicons name="close-circle" size={18} color={colors.faint} />
          </Pressable>
        ) : null}
      </View>

      {alumnos === null ? (
        <ActivityIndicator color={colors.brand} style={styles.cargando} />
      ) : alumnos.length === 0 ? (
        <Text style={styles.vacio}>
          {busca
            ? 'Nadie con ese nombre ni ese teléfono. Los alumnos nuevos se dan de alta en el panel.'
            : 'Todavía no hay alumnos en tu centro.'}
        </Text>
      ) : (
        <ScrollView style={styles.lista} keyboardShouldPersistTaps="handled">
          {alumnos.map((alumno) => (
            <Pressable
              key={alumno.id}
              accessibilityRole="button"
              accessibilityState={{ disabled: alumno.apuntado }}
              disabled={alumno.apuntado}
              onPress={() => onElegir(alumno)}
              style={({ pressed }) => [
                styles.alumno,
                alumno.apuntado && styles.alumnoDentro,
                pressed && !alumno.apuntado && { opacity: 0.7 },
              ]}>
              <Avatar nombre={alumno.nombre} />
              <View style={styles.alumnoTexto}>
                <Text style={styles.alumnoNombre} numberOfLines={1}>{alumno.nombre}</Text>
                <Text style={styles.alumnoPista} numberOfLines={1}>
                  {alumno.apuntado ? 'Ya está en esta clase' : resumenDePago(alumno)}
                </Text>
              </View>
              {alumno.apuntado ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.faint} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </>
  );
}

/** Lo que tiene para pagar esta clase, en una línea. */
function resumenDePago(alumno: AlumnoBuscado) {
  const bonos = alumno.bonos ?? [];
  const favores = alumno.favores ?? [];
  const partes: string[] = [];
  const clases = bonos.reduce((suma, bono) => suma + bono.quedan, 0);
  if (clases > 0) partes.push(clases === 1 ? '1 clase de bono' : `${clases} clases de bono`);
  const aFavor = favores.reduce((suma, favor) => suma + favor.quedan, 0);
  if (aFavor > 0) partes.push(aFavor === 1 ? '1 clase a favor' : `${aFavor} clases a favor`);
  return partes.length ? partes.join('  ·  ') : 'Sin bono para esta clase';
}

function ComoPaga({
  alumno, clase, guardando, fallo, onVolver, onElegir,
}: {
  alumno: AlumnoBuscado;
  clase: ClaseDetalle;
  guardando: boolean;
  fallo: string;
  onVolver: () => void;
  onElegir: (pago?: { bono?: string; mensualidad?: string }) => void;
}) {
  const bonos = alumno.bonos ?? [];
  const favores = alumno.favores ?? [];
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={onVolver}
        style={({ pressed }) => [styles.volver, pressed && { opacity: 0.7 }]}>
        <Ionicons name="chevron-back" size={18} color={colors.brandDark} />
        <Text style={styles.volverTexto}>Otra persona</Text>
      </Pressable>

      <Text style={styles.titulo}>{alumno.nombre}</Text>
      <Text style={styles.coletilla}>
        {clase.nombre} · {clase.hora}. ¿Con qué lo paga?
      </Text>

      {fallo ? (
        <View style={styles.error} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorTexto}>{fallo}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.lista} keyboardShouldPersistTaps="handled">
        {bonos.map((bono) => (
          <Opcion
            key={bono.id}
            icono="ticket-outline"
            titulo={bono.nombre}
            pie={bono.quedan === 1 ? 'Le queda 1 clase' : `Le quedan ${bono.quedan} clases`}
            desactivado={guardando}
            onPress={() => onElegir({ bono: bono.id })}
          />
        ))}
        {favores.map((favor) => (
          <Opcion
            key={favor.id}
            icono="refresh-outline"
            titulo="Clase a favor"
            pie={favor.quedan === 1 ? 'Le queda 1' : `Le quedan ${favor.quedan}`}
            desactivado={guardando}
            onPress={() => onElegir({ mensualidad: favor.id })}
          />
        ))}
        {/* Siempre: un centro cobra en efectivo, por Bizum o lo perdona, y eso
            no tiene por qué pasar por un bono. */}
        <Opcion
          icono="cash-outline"
          titulo="Sin gastar bono"
          pie={bonos.length || favores.length ? 'Lo cobras aparte' : 'La única opción que tiene ahora mismo'}
          desactivado={guardando}
          onPress={() => onElegir()}
        />
      </ScrollView>

      {guardando ? <ActivityIndicator color={colors.brand} style={styles.cargando} /> : null}
    </>
  );
}

function Opcion({
  icono, titulo, pie, desactivado, onPress,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  pie: string;
  desactivado: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={desactivado}
      onPress={onPress}
      style={({ pressed }) => [styles.opcion, pressed && { opacity: 0.7 }, desactivado && { opacity: 0.5 }]}>
      <View style={styles.opcionIcono}>
        <Ionicons name={icono} size={18} color={colors.brandDark} />
      </View>
      <View style={styles.alumnoTexto}>
        <Text style={styles.alumnoNombre} numberOfLines={1}>{titulo}</Text>
        <Text style={styles.alumnoPista} numberOfLines={1}>{pie}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.faint} />
    </Pressable>
  );
}

/** Quitar a alguien: la decisión no es «seguro?», es si le devuelves la clase. */
export function Quitar({
  visible, nombre, paga, aTiempo, guardando, onClose, onQuitar,
}: {
  visible: boolean;
  nombre: string;
  /** Con qué entró, para que se vea qué se le devuelve. */
  paga: string;
  /** Si cancelar a esta hora le devuelve la clase según la regla del centro. */
  aTiempo: boolean;
  guardando: boolean;
  onClose: () => void;
  onQuitar: (devolver?: boolean) => void;
}) {
  const gasta = Boolean(paga);
  return (
    <BottomSheet visible={visible} onClose={onClose} cerrarLabel="Cerrar">
      <Text style={styles.titulo}>Quitar a {nombre}</Text>
      <Text style={styles.coletilla}>
        {!gasta
          ? 'Su plaza se queda libre.'
          : aTiempo
            ? `Avisa con tiempo, así que la clase vuelve a ${paga} y no se le gasta.`
            : `Avisa con la clase encima: por la regla de tu centro, se le gasta la clase de ${paga}.`}
      </Text>

      <View style={styles.acciones}>
        {gasta && !aTiempo ? (
          <>
            {/* La urgencia de un alumno la juzga quien está en el mostrador, no
                el reloj. Por eso devolverla está aquí y no escondida. */}
            <Boton
              titulo="Quitar y devolverle la clase"
              variante="suave"
              onPress={() => onQuitar(true)}
            />
            <Boton
              titulo="Quitar, la clase se gasta"
              variante="secundario"
              onPress={() => onQuitar(false)}
            />
          </>
        ) : (
          <Boton titulo="Quitar de la clase" onPress={() => onQuitar()} />
        )}
        <Boton titulo="Dejarlo como está" variante="secundario" onPress={onClose} />
      </View>

      {guardando ? <ActivityIndicator color={colors.brand} style={styles.cargando} /> : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  coletilla: { fontSize: 14, color: colors.muted, marginTop: 2, lineHeight: 20 },
  buscador: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: space.md, marginTop: space.lg,
  },
  campo: { flex: 1, paddingVertical: space.md, fontSize: 16, color: colors.text },
  lista: { marginTop: space.md, maxHeight: 340 },
  cargando: { marginVertical: space.xl },
  vacio: { fontSize: 14, color: colors.muted, lineHeight: 21, marginTop: space.lg, marginBottom: space.md },
  alumno: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingVertical: space.sm + 2, paddingRight: space.xs,
  },
  alumnoDentro: { opacity: 0.55 },
  alumnoTexto: { flex: 1, gap: 2 },
  alumnoNombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  alumnoPista: { fontSize: 13, color: colors.muted },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: space.sm, alignSelf: 'flex-start' },
  volverTexto: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
  opcion: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingVertical: space.sm + 2, paddingRight: space.xs,
  },
  opcionIcono: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  acciones: { gap: space.sm, marginTop: space.lg },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md, marginTop: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
