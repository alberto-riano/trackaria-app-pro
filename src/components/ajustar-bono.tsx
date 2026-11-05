import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { BottomSheet } from '@/components/overlay';
import { Boton } from '@/components/ui';
import { ApiError, endpoints, type Alumno, type Bono } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Arreglar un bono con alguien delante.
 *
 * «Me cobraste una de más», «esta no la des, que avisó con tiempo». Eso se
 * dice en el mostrador y antes había que acordarse y abrir el panel por la
 * noche, que es como no hacerlo: o se arregla en el momento o se queda mal.
 *
 * El motivo es obligatorio, igual que en el panel, porque el ajuste se guarda
 * en el historial del bono y sin él, dentro de un mes, nadie sabe de dónde
 * salió esa clase. No es burocracia: es la diferencia entre un historial que
 * explica algo y una lista de números.
 *
 * Desactivar no borra. Un bono con clases gastadas tiene detrás unas reservas
 * que van a seguir ahí, y borrarlo las dejaría sin explicación. Las clases que
 * le queden se quedan donde están; lo que deja de poder hacerse es pagar con
 * él. Reactivarlo es del panel, que es donde se ve el historial entero.
 */
export function AjustarBono({
  bono, alumno, onClose, onCambiado,
}: {
  /** El bono abierto, o null cuando no hay ninguno. */
  bono: Bono | null;
  alumno: Alumno;
  onClose: () => void;
  onCambiado: (alumno: Alumno) => void;
}) {
  const { token } = useSession();
  const [delta, setDelta] = useState(0);
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [preguntando, setPreguntando] = useState(false);
  const [fallo, setFallo] = useState('');

  useEffect(() => {
    if (!bono) return;
    setDelta(0);
    setMotivo('');
    setPreguntando(false);
    setFallo('');
  }, [bono]);

  if (!bono) return <BottomSheet visible={false} onClose={onClose}>{null}</BottomSheet>;

  const quedarian = bono.quedan + delta;
  // Ni dejarlo igual ni dejarlo en negativo: las dos las rechaza el servidor,
  // y es mejor que el botón lo diga antes de tocarlo.
  const listo = delta !== 0 && quedarian >= 0 && motivo.trim().length > 0;

  async function guardar() {
    if (!token || !bono || !listo || guardando) return;
    setGuardando(true);
    setFallo('');
    try {
      const { alumno: actualizado } = await endpoints.ajustarBono(token, bono.id, delta, motivo);
      onCambiado(actualizado);
      onClose();
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido guardar el ajuste.');
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar() {
    if (!token || !bono || guardando) return;
    setGuardando(true);
    setFallo('');
    try {
      const { alumno: actualizado } = await endpoints.desactivarBono(token, bono.id);
      onCambiado(actualizado);
      onClose();
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido desactivar.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <BottomSheet visible onClose={onClose} cerrarLabel="Cerrar">
      <ScrollView
        style={styles.cuerpo}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo} numberOfLines={1}>{bono.nombre}</Text>
        <Text style={styles.coletilla}>
          {bono.clase ? `Solo para ${bono.clase}` : 'Vale para cualquier clase'} · le quedan {bono.quedan} de {bono.total}
        </Text>

        {fallo ? (
          <View style={styles.error} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorTexto}>{fallo}</Text>
          </View>
        ) : null}

        {/* Lo que se hace de verdad es «una más» o «una menos»: el contador
            enseña en qué se queda, que es lo que se le va a decir en voz alta. */}
        <View style={styles.contador}>
          <Paso
            signo="remove"
            etiqueta="Quitar una clase"
            onPress={() => setDelta(delta - 1)}
            apagado={quedarian <= 0 || guardando}
          />
          <View style={styles.cifra}>
            <Text style={styles.cifraNumero}>{quedarian}</Text>
            <Text style={styles.cifraPie}>
              {delta === 0 ? 'sin cambios' : delta > 0 ? `${delta} más` : `${-delta} menos`}
            </Text>
          </View>
          <Paso
            signo="add"
            etiqueta="Sumar una clase"
            onPress={() => setDelta(delta + 1)}
            apagado={guardando}
          />
        </View>

        <Text style={styles.etiqueta}>MOTIVO</Text>
        <TextInput
          value={motivo}
          onChangeText={setMotivo}
          placeholder="Avisó con tiempo, se le cobró de más…"
          placeholderTextColor={colors.faint}
          style={styles.campo}
          autoCapitalize="sentences"
          maxLength={200}
        />
        <Text style={styles.pista}>Se guarda en el historial del bono.</Text>

        <View style={styles.acciones}>
          <Boton
            titulo={guardando ? 'Guardando…' : 'Guardar el ajuste'}
            variante={listo && !guardando ? 'principal' : 'secundario'}
            onPress={guardar}
          />
        </View>

        {preguntando ? (
          <View style={styles.aviso}>
            <Text style={styles.avisoTexto}>
              Deja de servir para reservar. Las {bono.quedan} clases que le quedan no se
              pierden y su historial se conserva; volver a activarlo es del panel.
            </Text>
            <View style={styles.avisoBotones}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPreguntando(false)}
                style={({ pressed }) => [styles.secundario, pressed && { opacity: 0.7 }]}>
                <Text style={styles.secundarioTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={guardando}
                onPress={desactivar}
                style={({ pressed }) => [styles.peligro, pressed && { opacity: 0.7 }]}>
                <Text style={styles.peligroTexto}>Sí, desactivar</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => setPreguntando(true)}
            style={({ pressed }) => [styles.desactivar, pressed && { opacity: 0.7 }]}>
            <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
            <Text style={styles.desactivarTexto}>Desactivar este bono</Text>
          </Pressable>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

function Paso({
  signo, etiqueta, onPress, apagado,
}: {
  signo: 'add' | 'remove';
  etiqueta: string;
  onPress: () => void;
  apagado: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      disabled={apagado}
      onPress={onPress}
      style={({ pressed }) => [styles.paso, apagado && styles.pasoApagado, pressed && { opacity: 0.7 }]}>
      <Ionicons name={signo} size={22} color={apagado ? colors.faint : colors.brandDark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cuerpo: { flexShrink: 1 },
  titulo: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  coletilla: { fontSize: 14, color: colors.muted, marginTop: 2, lineHeight: 20 },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger },
  contador: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: space.lg, gap: space.md,
  },
  paso: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  pasoApagado: { backgroundColor: colors.background },
  cifra: { flex: 1, alignItems: 'center' },
  cifraNumero: { fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  cifraPie: { fontSize: 12, color: colors.faint, marginTop: 2 },
  etiqueta: {
    fontSize: 12, fontWeight: '800', color: colors.faint,
    letterSpacing: 0.4, marginTop: space.lg, marginBottom: space.xs,
  },
  campo: {
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: space.md, paddingVertical: space.md,
    fontSize: 16, color: colors.text,
  },
  pista: { fontSize: 12, color: colors.faint, marginTop: space.xs },
  acciones: { marginTop: space.lg },
  desactivar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: space.lg, minHeight: 44,
  },
  desactivarTexto: { fontSize: 14, fontWeight: '700', color: colors.danger },
  aviso: {
    marginTop: space.lg, backgroundColor: colors.dangerSoft,
    borderRadius: radius.md, padding: space.md, gap: space.sm,
  },
  avisoTexto: { fontSize: 14, color: colors.text, lineHeight: 20 },
  avisoBotones: { flexDirection: 'row', gap: space.sm },
  secundario: {
    flex: 1, minHeight: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  secundarioTexto: { fontSize: 15, fontWeight: '700', color: colors.muted },
  peligro: {
    flex: 1, minHeight: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  peligroTexto: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
