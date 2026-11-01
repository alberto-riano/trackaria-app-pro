import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';

import {
  AltaDeAlumno, CampoDeBusqueda, FilaDeAlumno, NoEsta, useBusqueda,
} from '@/components/buscar-alumno';
import { BottomSheet } from '@/components/overlay';
import { colors, space } from '@/lib/theme';
import { useState } from 'react';

/**
 * Buscar a alguien del centro para llegar a su ficha.
 *
 * Hace falta porque la otra forma de llegar a un alumno es entrar en una clase
 * en la que esté, y quien entra por la puerta preguntando «¿me queda bono?» no
 * tiene por qué estar apuntado a nada hoy.
 *
 * Si no está, se le da de alta aquí y se va directo a su ficha, que es donde se
 * le vende el bono.
 */
export function BuscarAlumno({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [dandoDeAlta, setDandoDeAlta] = useState(false);
  const { busca, setBusca, alumnos } = useBusqueda(visible && !dandoDeAlta);

  function abrir(id: string) {
    onClose();
    setDandoDeAlta(false);
    router.push(`/alumno/${id}`);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} cerrarLabel="Cerrar">
      {dandoDeAlta ? (
        <AltaDeAlumno
          nombreSugerido={busca}
          onVolver={() => setDandoDeAlta(false)}
          onAlta={(alta) => abrir(alta.id)}
        />
      ) : (
        <>
          <Text style={styles.titulo}>Buscar a un alumno</Text>
          <Text style={styles.coletilla}>Para ver qué tiene y darle un bono.</Text>

          <CampoDeBusqueda valor={busca} onCambiar={setBusca} autoFocus />

          {alumnos === null ? (
            <ActivityIndicator color={colors.brand} style={styles.cargando} />
          ) : alumnos.length === 0 ? (
            <NoEsta busca={busca} onAlta={() => setDandoDeAlta(true)} />
          ) : (
            <ScrollView style={styles.lista} keyboardShouldPersistTaps="handled">
              {alumnos.map((alumno) => (
                <FilaDeAlumno
                  key={alumno.id}
                  alumno={alumno}
                  pista={alumno.telefono || 'Sin teléfono'}
                  onPress={() => abrir(alumno.id)}
                />
              ))}
            </ScrollView>
          )}
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  coletilla: { fontSize: 14, color: colors.muted, marginTop: 2, lineHeight: 20 },
  lista: { marginTop: space.md, maxHeight: 360 },
  cargando: { marginVertical: space.xl },
});
