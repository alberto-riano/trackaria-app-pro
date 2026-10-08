import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/overlay';
import { comoFecha, inicioDeMes, mismoMes, moverMes, semanasDelMes, tituloDeMes } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Saltar a un día cualquiera sin ir pasando semanas con el dedo. */
export function Calendario({
  visible, elegido, hoy, onElegir, onClose,
}: {
  visible: boolean;
  elegido: string;
  hoy: string;
  onElegir: (iso: string) => void;
  onClose: () => void;
}) {
  const [mes, setMes] = useState(() => inicioDeMes(elegido));

  // Si se abre desde otro día, empieza por su mes y no por el último que se miró.
  useEffect(() => {
    if (visible) setMes(inicioDeMes(elegido));
  }, [visible, elegido]);

  return (
    <BottomSheet visible={visible} onClose={onClose} cerrarLabel="Cerrar el calendario">
      <View style={styles.cabecera}>
        <Text style={styles.mes}>{tituloDeMes(mes)}</Text>
        <View style={styles.flechas}>
          <Flecha icono="chevron-back" etiqueta="Mes anterior" onPress={() => setMes(moverMes(mes, -1))} />
          <Flecha icono="chevron-forward" etiqueta="Mes siguiente" onPress={() => setMes(moverMes(mes, 1))} />
        </View>
      </View>

      <View style={styles.letras}>
        {LETRAS.map((letra, indice) => (
          <Text key={`${letra}-${indice}`} style={styles.letra}>{letra}</Text>
        ))}
      </View>

      {semanasDelMes(mes).map((semana) => (
        <View key={semana[0]} style={styles.semana}>
          {semana.map((iso) => {
            const fuera = !mismoMes(iso, mes);
            const activo = iso === elegido;
            return (
              <Pressable
                key={iso}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                onPress={() => { onElegir(iso); onClose(); }}
                style={({ pressed }) => [styles.celda, activo && styles.celdaElegida, pressed && { opacity: 0.7 }]}>
                <Text
                  style={[
                    styles.numero,
                    fuera && styles.numeroFuera,
                    activo && styles.numeroElegido,
                    iso === hoy && !activo && styles.numeroHoy,
                  ]}>
                  {comoFecha(iso).getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </BottomSheet>
  );
}

function Flecha({ icono, etiqueta, onPress }: { icono: 'chevron-back' | 'chevron-forward'; etiqueta: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={({ pressed }) => [styles.flecha, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icono} size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  mes: { fontSize: 18, fontWeight: '800', color: colors.text },
  flechas: { flexDirection: 'row', gap: space.xs },
  flecha: {
    width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
  },
  letras: { flexDirection: 'row', marginBottom: space.xs },
  letra: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', color: colors.faint },
  semana: { flexDirection: 'row' },
  celda: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  celdaElegida: { backgroundColor: colors.brand },
  numero: { fontSize: 16, fontWeight: '600', color: colors.text },
  numeroFuera: { color: colors.faint },
  numeroElegido: { color: '#fff', fontWeight: '800' },
  numeroHoy: { color: colors.brand, fontWeight: '800' },
});
