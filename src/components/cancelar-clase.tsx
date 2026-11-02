import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { BottomSheet } from '@/components/overlay';
import { Avatar, Boton } from '@/components/ui';
import { ApiError, endpoints, type ClaseDetalle, type ResumenDeCancelar } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Cancelar una clase entera.
 *
 * Es lo más urgente que hace esta app y lo que más justifica que exista: «la
 * instructora está mala y el de las siete no se da» se decide a las ocho de la
 * mañana, y hasta que no se cancela hay gente que va a presentarse en la puerta.
 *
 * Nadie pierde su clase: no es culpa de quien se apuntó, así que vuelve a su
 * bono o se le suma una a favor. Eso se dice **antes**, porque es la pregunta
 * que frena a quien está a punto de pulsar.
 *
 * Y después no se cierra con un «hecho»: se dice a quién hay que llamar. El
 * aviso llega por la app del alumno, así que quien no la tiene sigue contando
 * con venir. Esa lista es trabajo que queda, no un dato.
 */
export function CancelarClase({
  visible, clase, onClose, onCancelada,
}: {
  visible: boolean;
  clase: ClaseDetalle;
  onClose: () => void;
  onCancelada: (clase: ClaseDetalle) => void;
}) {
  const { token } = useSession();
  const [motivo, setMotivo] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [fallo, setFallo] = useState('');
  const [resumen, setResumen] = useState<ResumenDeCancelar | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMotivo('');
    setFallo('');
    setResumen(null);
  }, [visible]);

  const cuantos = clase.apuntados.length;
  const esperando = clase.espera.length;

  async function cancelar() {
    if (!token || cancelando) return;
    setCancelando(true);
    setFallo('');
    try {
      const { clase: actualizada, resumen: hecho } = await endpoints.cancelarClase(
        token, clase.id, motivo,
      );
      onCancelada(actualizada);
      setResumen(hecho);
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido cancelar.');
    } finally {
      setCancelando(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} cerrarLabel="Cerrar">
      {resumen ? (
        <Hecho resumen={resumen} onClose={onClose} />
      ) : (
        <>
          <Text style={styles.titulo}>Cancelar la clase</Text>
          <Text style={styles.coletilla}>
            {clase.nombre} · {clase.hora}
          </Text>

          {fallo ? (
            <View style={styles.error} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorTexto}>{fallo}</Text>
            </View>
          ) : null}

          {/* Lo que va a pasar, antes de que pase. Es lo que decide si se pulsa. */}
          <View style={styles.aviso}>
            <Ionicons name="information-circle-outline" size={18} color={colors.brandDark} />
            <Text style={styles.avisoTexto}>{queVaAPasar(cuantos, esperando)}</Text>
          </View>

          <Text style={styles.etiqueta}>POR QUÉ</Text>
          <TextInput
            value={motivo}
            onChangeText={setMotivo}
            placeholder="La instructora está de baja."
            placeholderTextColor={colors.faint}
            style={styles.campo}
            maxLength={200}
            multiline
            textAlignVertical="top"
          />
          {/* Va dentro del aviso que reciben: sin motivo, el alumno se entera de
              que no hay clase y llama al centro a preguntar por qué. */}
          <Text style={styles.ayuda}>Se lo contamos a ellos en el aviso. Puedes dejarlo en blanco.</Text>

          <View style={styles.acciones}>
            <Pressable
              accessibilityRole="button"
              disabled={cancelando}
              onPress={cancelar}
              style={({ pressed }) => [styles.rojo, pressed && { opacity: 0.8 }, cancelando && { opacity: 0.6 }]}>
              <Text style={styles.rojoTexto}>
                {cancelando ? 'Cancelando…' : 'Cancelar la clase'}
              </Text>
            </Pressable>
            <Boton titulo="Dejarlo como está" variante="secundario" onPress={onClose} />
          </View>

          {cancelando ? <ActivityIndicator color={colors.brand} style={styles.cargando} /> : null}
        </>
      )}
    </BottomSheet>
  );
}

/** Qué se lleva por delante cancelar, dicho antes de pulsar. */
function queVaAPasar(cuantos: number, esperando: number) {
  if (cuantos === 0 && esperando === 0) {
    return 'No hay nadie apuntado, así que no se queda nadie tirado.';
  }
  const partes: string[] = [];
  if (cuantos > 0) {
    partes.push(
      cuantos === 1
        ? 'A la persona apuntada se le devuelve su clase y se le avisa'
        : `A las ${cuantos} personas apuntadas se les devuelve su clase y se les avisa`,
    );
  }
  if (esperando > 0) {
    partes.push(
      esperando === 1 ? 'y se avisa a quien estaba en lista de espera' : `y a las ${esperando} de la lista de espera`,
    );
  }
  return `${partes.join(' ')}. Nadie pierde nada.`;
}

function Hecho({ resumen, onClose }: { resumen: ResumenDeCancelar; onClose: () => void }) {
  const llamar = resumen.por_llamar;
  return (
    <>
      <View style={styles.hechoCabecera}>
        <View style={styles.hechoIcono}>
          <Ionicons name="checkmark-done" size={26} color={colors.success} />
        </View>
        <Text style={styles.titulo}>Clase cancelada</Text>
        <Text style={[styles.coletilla, styles.coletillaCentrada]}>
          {resumen.avisados === 0
            ? 'No había nadie a quien avisar por la app.'
            : resumen.avisados === 1
              ? 'A 1 persona le ha llegado el aviso en su app.'
              : `A ${resumen.avisados} personas les ha llegado el aviso en su app.`}
        </Text>
      </View>

      {llamar.length > 0 ? (
        <>
          {/* Lo que queda por hacer, con el número puesto: sin la app no se
              enteran, y van a presentarse en la puerta. */}
          <View style={styles.pendiente}>
            <Ionicons name="call-outline" size={18} color={colors.warning} />
            <Text style={styles.pendienteTexto}>
              {llamar.length === 1
                ? 'A esta persona hay que llamarla: no tiene la app.'
                : `A estas ${llamar.length} hay que llamarlas: no tienen la app.`}
            </Text>
          </View>

          <ScrollView style={styles.lista}>
            {llamar.map((quien) => (
              <Pressable
                key={quien.id}
                accessibilityRole="button"
                accessibilityLabel={`Llamar a ${quien.nombre}`}
                disabled={!quien.telefono}
                onPress={() => Linking.openURL(`tel:${quien.telefono}`)}
                style={({ pressed }) => [styles.fila, pressed && { opacity: 0.7 }]}>
                <Avatar nombre={quien.nombre} />
                <View style={styles.filaTexto}>
                  <Text style={styles.filaNombre} numberOfLines={1}>{quien.nombre}</Text>
                  <Text style={styles.filaPista} numberOfLines={1}>
                    {quien.telefono || 'Sin teléfono'}
                  </Text>
                </View>
                {quien.telefono ? (
                  <Ionicons name="call" size={18} color={colors.brandDark} />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      <View style={styles.acciones}>
        <Boton titulo="Listo" onPress={onClose} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  coletilla: { fontSize: 14, color: colors.muted, marginTop: 2, lineHeight: 20 },
  coletillaCentrada: { textAlign: 'center' },
  etiqueta: {
    fontSize: 12, fontWeight: '800', color: colors.faint,
    letterSpacing: 0.4, marginTop: space.lg, marginBottom: space.xs,
  },
  campo: {
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: space.md, paddingVertical: space.md,
    fontSize: 16, color: colors.text, minHeight: 72,
  },
  ayuda: { fontSize: 13, color: colors.faint, marginTop: space.xs, lineHeight: 18 },
  aviso: {
    flexDirection: 'row', alignItems: 'flex-start', gap: space.sm,
    backgroundColor: colors.brandSoft, borderRadius: radius.md,
    padding: space.md, marginTop: space.lg,
  },
  avisoTexto: { flex: 1, fontSize: 14, color: colors.brandDark, fontWeight: '600', lineHeight: 20 },
  acciones: { gap: space.sm, marginTop: space.lg },
  rojo: {
    minHeight: 48, borderRadius: radius.md, backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg,
  },
  rojoTexto: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cargando: { marginTop: space.md },
  hechoCabecera: { alignItems: 'center', gap: space.xs, paddingVertical: space.md },
  hechoIcono: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.successSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: space.sm,
  },
  pendiente: {
    flexDirection: 'row', alignItems: 'flex-start', gap: space.sm,
    backgroundColor: colors.warningSoft, borderRadius: radius.md,
    padding: space.md, marginTop: space.md,
  },
  pendienteTexto: { flex: 1, fontSize: 14, color: colors.warning, fontWeight: '600', lineHeight: 20 },
  lista: { marginTop: space.sm, flexShrink: 1, maxHeight: 260 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  filaTexto: { flex: 1, gap: 2 },
  filaNombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  filaPista: { fontSize: 13, color: colors.muted },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md, marginTop: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
