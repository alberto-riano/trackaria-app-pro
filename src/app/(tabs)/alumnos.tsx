import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AltaDeAlumno, useBusqueda } from '@/components/buscar-alumno';
import { BottomSheet } from '@/components/overlay';
import { Avatar, Boton, EmptyState, Encabezado } from '@/components/ui';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * La gente del centro.
 *
 * Tiene pestaña propia y no una lupa escondida en la cabecera de Clases porque
 * media conversación del mostrador empieza por una persona y no por una clase:
 * «¿me queda bono?», «¿a qué vine el mes pasado?». Buscarla no debería obligar
 * a acordarse primero de a qué clase viene.
 *
 * Y porque esto es una pantalla entera y no una hoja: con el teclado abierto,
 * una hoja pegada al borde de abajo deja la lista de resultados detrás del
 * teclado, que es justo lo que se está mirando mientras se escribe.
 */
export default function AlumnosScreen() {
  const insets = useSafeAreaInsets();
  const { usuario } = useSession();
  const [dandoDeAlta, setDandoDeAlta] = useState(false);
  const { busca, setBusca, alumnos, refrescar } = useBusqueda(true);

  // Al volver a la pestaña se vuelve a preguntar: puede haberse dado de alta a
  // alguien desde «Apuntar» mientras tanto.
  useFocusEffect(useCallback(() => { refrescar(); }, [refrescar]));

  return (
    <>
      <View style={[styles.cabecera, { paddingTop: insets.top + space.lg }]}>
        <Encabezado titulo="Alumnos" coletilla={usuario?.centro.nombre} />

        <View style={styles.buscador}>
          <Ionicons name="search" size={17} color={colors.faint} />
          <TextInput
            style={styles.campo}
            value={busca}
            onChangeText={setBusca}
            placeholder="Nombre o teléfono"
            placeholderTextColor={colors.faint}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        {alumnos === null ? (
          <ActivityIndicator color={colors.brand} style={styles.cargando} />
        ) : alumnos.length === 0 ? (
          <EmptyState
            title={busca ? 'Nadie con ese nombre' : 'Todavía no hay nadie'}
            text={
              busca
                ? 'Ni por nombre ni por teléfono. Si acaba de entrar por la puerta, dale de alta.'
                : 'Aquí aparecerá la gente de tu centro según vayas dándola de alta.'
            }
          />
        ) : (
          <View style={styles.lista}>
            {alumnos.map((alumno) => (
              <Pressable
                key={alumno.id}
                accessibilityRole="button"
                accessibilityLabel={`Ver la ficha de ${alumno.nombre}`}
                onPress={() => router.push(`/alumno/${alumno.id}`)}
                style={({ pressed }) => [styles.fila, pressed && { opacity: 0.7 }]}>
                <Avatar nombre={alumno.nombre} />
                <View style={styles.filaTexto}>
                  <Text style={styles.nombre} numberOfLines={1}>{alumno.nombre}</Text>
                  <Text style={styles.pista} numberOfLines={1}>
                    {alumno.telefono || 'Sin teléfono'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.faint} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Abajo del todo y siempre, con resultados o sin ellos: quien entra por
            la puerta lo hace a media búsqueda, cuando ya has visto que no está. */}
        <View style={styles.alta}>
          <Boton
            titulo="Dar de alta a alguien nuevo"
            variante={alumnos?.length === 0 ? 'principal' : 'suave'}
            onPress={() => setDandoDeAlta(true)}
          />
        </View>
      </ScrollView>

      <BottomSheet visible={dandoDeAlta} onClose={() => setDandoDeAlta(false)} cerrarLabel="Cerrar">
        <AltaDeAlumno
          nombreSugerido={busca}
          onVolver={() => setDandoDeAlta(false)}
          volverTexto="Dejarlo"
          onAlta={(alta) => {
            setDandoDeAlta(false);
            router.push(`/alumno/${alta.id}`);
          }}
        />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  cabecera: { paddingHorizontal: space.lg, backgroundColor: colors.background },
  contenido: { padding: space.lg, paddingTop: space.md, paddingBottom: space.xxl },
  cargando: { marginTop: space.xxl },
  buscador: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: space.md, marginBottom: space.md,
  },
  campo: { flex: 1, paddingVertical: space.md, fontSize: 16, color: colors.text },
  lista: { gap: space.xs },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: space.md,
  },
  filaTexto: { flex: 1, gap: 2 },
  nombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  pista: { fontSize: 13, color: colors.muted },
  alta: { marginTop: space.lg },
});
