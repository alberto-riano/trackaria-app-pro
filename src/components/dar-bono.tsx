import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { BottomSheet } from '@/components/overlay';
import { Boton } from '@/components/ui';
import { ApiError, endpoints, type Alumno, type TipoDeClase } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/** Los bonos que vende de verdad un centro. Lo demás se escribe a mano. */
const HABITUALES = [5, 10, 20];

/**
 * Venderle un bono sin soltar el móvil.
 *
 * Es el final de la escena del mostrador: entra, no le queda, le vendes uno y
 * le apuntas. Por eso está aquí y no solo en el panel.
 *
 * El número va en botones y no en un campo numérico: los bonos de un centro son
 * tres o cuatro, siempre los mismos, y teclear «10» con alguien delante es
 * trabajo de balde. El campo sigue estando para el bono raro.
 *
 * Atarlo a una clase es opcional y nace suelto: la mayoría de los bonos valen
 * para todo, y el que no, lo sabe quien lo vende.
 */
export function DarBono({
  visible, alumno, onClose, onDado,
}: {
  visible: boolean;
  alumno: Alumno;
  onClose: () => void;
  onDado: (alumno: Alumno) => void;
}) {
  const { token } = useSession();
  const [clases, setClases] = useState(HABITUALES[1]);
  const [aMano, setAMano] = useState('');
  const [tipo, setTipo] = useState<TipoDeClase | null>(null);
  const [tipos, setTipos] = useState<TipoDeClase[] | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState('');

  useEffect(() => {
    if (!visible) return;
    setClases(HABITUALES[1]);
    setAMano('');
    setTipo(null);
    setFallo('');
  }, [visible]);

  // Las clases del centro solo hacen falta si alguien quiere atar el bono a
  // una, así que se piden al abrir la hoja y no antes.
  useEffect(() => {
    if (!visible || !token || tipos !== null) return;
    let vigente = true;
    endpoints
      .tiposDeClase(token)
      .then(({ tipos: encontrados }) => { if (vigente) setTipos(encontrados); })
      .catch(() => { if (vigente) setTipos([]); });
    return () => { vigente = false; };
  }, [visible, token, tipos]);

  const cuantas = aMano ? Number(aMano) : clases;
  const valida = Number.isInteger(cuantas) && cuantas > 0 && cuantas <= 500;

  // El nombre lo pone la app y no se pregunta: «Bono 10 clases» es como lo
  // llama todo el mundo, y un campo más es un campo más que rellenar de pie.
  const nombre = useCallback(
    () => (tipo ? `Bono ${cuantas} de ${tipo.nombre}` : `Bono ${cuantas} clases`),
    [cuantas, tipo],
  );

  async function dar() {
    if (!token || !valida || guardando) return;
    setGuardando(true);
    setFallo('');
    try {
      const { alumno: actualizado } = await endpoints.darBono(
        token, alumno.id, cuantas, nombre(), tipo?.id ?? '',
      );
      onDado(actualizado);
      onClose();
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido dar el bono.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} cerrarLabel="Cerrar">
      <Text style={styles.titulo}>Darle un bono</Text>
      <Text style={styles.coletilla}>{alumno.nombre}</Text>

      {fallo ? (
        <View style={styles.error} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorTexto}>{fallo}</Text>
        </View>
      ) : null}

      <Text style={styles.etiqueta}>CUÁNTAS CLASES</Text>
      <View style={styles.cuantas}>
        {HABITUALES.map((cuantasOpcion) => {
          const puesta = !aMano && clases === cuantasOpcion;
          return (
            <Pressable
              key={cuantasOpcion}
              accessibilityRole="button"
              accessibilityState={{ selected: puesta }}
              onPress={() => { setClases(cuantasOpcion); setAMano(''); }}
              style={({ pressed }) => [
                styles.ficha, puesta && styles.fichaPuesta, pressed && { opacity: 0.7 },
              ]}>
              <Text style={[styles.fichaTexto, puesta && styles.fichaTextoPuesta]}>{cuantasOpcion}</Text>
            </Pressable>
          );
        })}
        <TextInput
          value={aMano}
          onChangeText={(texto) => setAMano(texto.replace(/[^0-9]/g, '').slice(0, 3))}
          placeholder="Otro"
          placeholderTextColor={colors.faint}
          style={[styles.ficha, styles.fichaCampo, Boolean(aMano) && styles.fichaPuesta]}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>

      <Text style={styles.etiqueta}>PARA QUÉ CLASES</Text>
      {tipos === null ? (
        <ActivityIndicator color={colors.brand} style={styles.cargandoTipos} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.tipos}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: tipo === null }}
            onPress={() => setTipo(null)}
            style={({ pressed }) => [
              styles.tipo, tipo === null && styles.tipoPuesto, pressed && { opacity: 0.7 },
            ]}>
            <Text style={[styles.tipoTexto, tipo === null && styles.tipoTextoPuesto]}>Cualquiera</Text>
          </Pressable>
          {tipos.map((opcion) => {
            const puesto = tipo?.id === opcion.id;
            return (
              <Pressable
                key={opcion.id}
                accessibilityRole="button"
                accessibilityState={{ selected: puesto }}
                onPress={() => setTipo(puesto ? null : opcion)}
                style={({ pressed }) => [
                  styles.tipo, puesto && styles.tipoPuesto, pressed && { opacity: 0.7 },
                ]}>
                <View style={[styles.punto, { backgroundColor: opcion.color || colors.brand }]} />
                <Text style={[styles.tipoTexto, puesto && styles.tipoTextoPuesto]} numberOfLines={1}>
                  {opcion.nombre}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Lo que se va a crear, con sus palabras, antes de crearlo. Un bono mal
          dado se arregla en el panel, pero enterarse tarde es el problema. */}
      <View style={styles.resumen}>
        <Ionicons name="ticket-outline" size={18} color={colors.brandDark} />
        <Text style={styles.resumenTexto}>
          {valida
            ? `${nombre()}, listo para gastar hoy mismo.`
            : 'Dinos cuántas clases lleva el bono.'}
        </Text>
      </View>

      <View style={styles.acciones}>
        <Boton
          titulo={guardando ? 'Dándolo…' : 'Darle el bono'}
          variante={valida && !guardando ? 'principal' : 'secundario'}
          onPress={dar}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  coletilla: { fontSize: 14, color: colors.muted, marginTop: 2 },
  etiqueta: {
    fontSize: 12, fontWeight: '800', color: colors.faint,
    letterSpacing: 0.4, marginTop: space.lg,
  },
  cuantas: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  ficha: {
    flex: 1, height: 52, borderRadius: radius.md, backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  fichaPuesta: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  fichaTexto: { fontSize: 18, fontWeight: '800', color: colors.muted },
  fichaTextoPuesta: { color: colors.brandDark },
  // `minWidth: 0` para que el campo reparta el ancho con los botones en vez
  // de quedarse con el suyo propio: un input trae de serie sitio para veinte
  // caracteres y aquí caben tres.
  fichaCampo: {
    minWidth: 0, fontSize: 18, fontWeight: '800',
    color: colors.brandDark, textAlign: 'center',
  },
  cargandoTipos: { alignSelf: 'flex-start', marginTop: space.md },
  tipos: { gap: space.sm, paddingVertical: space.sm, paddingRight: space.lg },
  tipo: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    paddingHorizontal: space.md, height: 40, borderRadius: radius.pill,
    backgroundColor: colors.background, borderWidth: 1.5, borderColor: 'transparent',
    maxWidth: 220,
  },
  tipoPuesto: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  tipoTexto: { fontSize: 14, fontWeight: '700', color: colors.muted },
  tipoTextoPuesto: { color: colors.brandDark },
  punto: { width: 8, height: 8, borderRadius: 4 },
  resumen: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.brandSoft, borderRadius: radius.md,
    padding: space.md, marginTop: space.lg,
  },
  resumenTexto: { flex: 1, fontSize: 14, color: colors.brandDark, fontWeight: '600', lineHeight: 20 },
  acciones: { gap: space.sm, marginTop: space.lg },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md, marginTop: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
