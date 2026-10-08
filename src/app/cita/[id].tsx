import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar, Boton, Card, Chip } from '@/components/ui';
import { ApiError, endpoints } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { comoFecha, dayTitle } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Una cita por dentro.
 *
 * La lista de la agenda enseña lo que se mira de reojo —hora, quién y con
 * quién—. Aquí va lo que se mira cuando algo no cuadra: por qué viene esa
 * persona, de dónde salió la cita y cómo seguir hablando con ella.
 *
 * Tampoco se cambia nada: para mover o cancelar está el panel.
 */
export default function CitaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useSession();
  const { datos, error, recargar } = useDatos(
    useCallback((clave: string) => endpoints.cita(clave, id), [id]),
  );
  const [confirmando, setConfirmando] = useState(false);
  const [fallo, setFallo] = useState('');

  const cita = datos?.cita ?? null;

  async function confirmar() {
    if (!token || confirmando) return;
    setConfirmando(true);
    setFallo('');
    try {
      await endpoints.confirmarCita(token, id);
      await recargar();
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido confirmar.');
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Stack.Screen options={{ title: 'Cita', headerBackButtonDisplayMode: 'minimal' }} />

      {error || fallo ? (
        <View style={styles.error} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorTexto}>{error || fallo}</Text>
        </View>
      ) : null}

      {cita === null ? (
        <ActivityIndicator color={colors.brand} style={styles.cargando} />
      ) : (
        <>
          <Card style={styles.cabecera}>
            <Avatar nombre={cita.persona} />
            <Text style={styles.persona}>{cita.persona}</Text>
            <Text style={styles.cuando}>
              {dayTitle(comoFecha(cita.fecha))} · {cita.hora}
            </Text>
            <Text style={styles.detalle}>
              {[`${cita.minutos} min`, cita.profesional].filter(Boolean).join(' · ')}
            </Text>
            {cita.estado === 'requested' ? (
              <View style={styles.chips}><Chip label="Sin confirmar" tone="warning" /></View>
            ) : null}
          </Card>

          {cita.motivo || cita.descripcion ? (
            <Bloque titulo="Por qué viene">
              {cita.motivo ? <Text style={styles.motivo}>{cita.motivo}</Text> : null}
              {cita.descripcion ? <Text style={styles.descripcion}>{cita.descripcion}</Text> : null}
            </Bloque>
          ) : null}

          {cita.origen_texto ? (
            <Bloque titulo="Cómo se reservó">
              <View style={styles.origen}>
                <Ionicons
                  name={cita.origen === 'whatsapp' ? 'logo-whatsapp' : 'create-outline'}
                  size={18}
                  color={cita.origen === 'whatsapp' ? '#25D366' : colors.muted}
                />
                <Text style={styles.origenTexto}>{cita.origen_texto}</Text>
              </View>
              {cita.creada ? (
                <Text style={styles.nota}>
                  Entró el {new Date(cita.creada).toLocaleDateString('es-ES')} a las{' '}
                  {new Date(cita.creada).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.
                </Text>
              ) : null}
            </Bloque>
          ) : null}

          <View style={styles.acciones}>
            {cita.estado === 'requested' ? (
              <Boton
                titulo={confirmando ? 'Confirmando…' : 'Confirmar la cita'}
                onPress={confirmar}
              />
            ) : null}

            {cita.chat ? (
              <Boton
                titulo={cita.chat_del_origen ? 'Ver la conversación de esta cita' : 'Abrir su chat'}
                variante="suave"
                onPress={() => router.push(`/chat/${cita.chat}`)}
              />
            ) : null}

            {cita.telefono ? (
              <Boton
                titulo="Llamar"
                variante="secundario"
                onPress={() => Linking.openURL(`tel:${cita.telefono.replace(/\s/g, '')}`)}
              />
            ) : null}
          </View>

          <Text style={styles.pie}>
            Para mover o cancelar la cita, el panel: ahí se ve lo que arrastra —el calendario de
            Google y el aviso al paciente—.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.bloque}>
      <Text style={styles.bloqueTitulo}>{titulo.toUpperCase()}</Text>
      <Card style={styles.bloqueCaja}>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, paddingBottom: space.xxl, gap: space.lg },
  cargando: { marginTop: space.xxl },
  cabecera: { alignItems: 'center', gap: 3 },
  persona: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: space.sm },
  cuando: { fontSize: 17, fontWeight: '700', color: colors.brandDark },
  detalle: { fontSize: 14, color: colors.muted },
  chips: { marginTop: space.sm },
  bloque: { gap: space.sm },
  bloqueTitulo: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: colors.faint, paddingHorizontal: space.xs },
  bloqueCaja: { gap: space.sm },
  motivo: { fontSize: 16, color: colors.text, lineHeight: 22 },
  descripcion: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  origen: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  origenTexto: { flex: 1, fontSize: 15, color: colors.text },
  nota: { fontSize: 13, color: colors.faint },
  acciones: { gap: space.sm },
  pie: { fontSize: 13, color: colors.faint, textAlign: 'center', lineHeight: 19 },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
