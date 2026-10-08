import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { DiaDeLaSemana } from '@/lib/api';
import { comoFecha, lunesDe, sumarDias } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
/** Cuántas semanas hay a cada lado. Más allá se pide con el calendario. */
const ALCANCE = 26;

type Props = {
  /** El día que se está mirando. */
  elegido: string;
  hoy: string;
  /** La carga de la semana del día elegido. De las demás no se sabe hasta llegar. */
  carga: DiaDeLaSemana[];
  onElegir: (iso: string) => void;
};

/**
 * La semana, deslizable.
 *
 * Se mueve con el dedo como un calendario de verdad. Al cambiar de semana se
 * elige el mismo día que tenías —si mirabas el jueves, te quedas en el jueves—,
 * que además es lo que dispara la carga de esa semana: así no hay dos sitios
 * donde se decide qué día se está mirando.
 */
export function TiraSemanas({ elegido, hoy, carga, onElegir }: Props) {
  const { width } = useWindowDimensions();
  const ancho = width - space.lg * 2;
  const lista = useRef<FlatList<string>>(null);

  const semanas = useMemo(
    () => Array.from({ length: ALCANCE * 2 + 1 }, (_, indice) => sumarDias(lunesDe(hoy), (indice - ALCANCE) * 7)),
    [hoy],
  );

  const indiceDe = (iso: string) => semanas.indexOf(lunesDe(iso));
  const [pagina, setPagina] = useState(() => Math.max(0, indiceDe(elegido)));

  // El día puede cambiar desde fuera —el calendario, «volver a hoy»—, y entonces
  // la tira tiene que irse a su semana o el día elegido se queda fuera de pantalla.
  useEffect(() => {
    const destino = indiceDe(elegido);
    if (destino < 0 || destino === pagina) return;
    setPagina(destino);
    lista.current?.scrollToIndex({ index: destino, animated: true });
  }, [elegido]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargaPorDia = useMemo(
    () => Object.fromEntries(carga.map((dia) => [dia.fecha, dia])),
    [carga],
  );

  return (
    <FlatList
      ref={lista}
      data={semanas}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={Math.max(0, indiceDe(elegido))}
      getItemLayout={(_, indice) => ({ length: ancho, offset: ancho * indice, index: indice })}
      keyExtractor={(lunes) => lunes}
      onMomentumScrollEnd={(evento) => {
        const nueva = Math.round(evento.nativeEvent.contentOffset.x / ancho);
        if (nueva === pagina) return;
        setPagina(nueva);
        // El mismo día de la semana que tenías, en la semana a la que has llegado.
        const salto = (comoFecha(elegido).getDay() + 6) % 7;
        onElegir(sumarDias(semanas[nueva], salto));
      }}
      renderItem={({ item: lunes }) => (
        <View style={[styles.semana, { width: ancho }]}>
          {Array.from({ length: 7 }, (_, salto) => {
            const iso = sumarDias(lunes, salto);
            const dia = cargaPorDia[iso];
            const activo = iso === elegido;
            return (
              <Pressable
                key={iso}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                onPress={() => onElegir(iso)}
                style={({ pressed }) => [styles.dia, activo && styles.diaElegido, pressed && { opacity: 0.7 }]}>
                <Text style={[styles.letra, activo && styles.textoElegido]}>{LETRAS[salto]}</Text>
                <Text
                  style={[
                    styles.numero,
                    activo && styles.textoElegido,
                    iso === hoy && !activo && styles.numeroHoy,
                  ]}>
                  {comoFecha(iso).getDate()}
                </Text>
                {/* Cuánto hay, sin números: lo que se mira de reojo es si el día
                    está lleno o vacío, no si tiene cinco citas o seis. */}
                <View style={styles.marca}>
                  {dia && dia.citas > 0 ? (
                    <View
                      style={[
                        styles.punto,
                        { backgroundColor: activo ? '#fff' : colors.brand },
                        dia.sin_confirmar > 0 && !activo && { backgroundColor: colors.warning },
                        dia.citas >= 5 && styles.puntoLleno,
                      ]}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  semana: { flexDirection: 'row', gap: 4 },
  dia: {
    flex: 1, alignItems: 'center', gap: 1, paddingVertical: space.sm,
    borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  diaElegido: { backgroundColor: colors.brand, borderColor: colors.brand },
  letra: { fontSize: 10, fontWeight: '700', color: colors.faint },
  numero: { fontSize: 16, fontWeight: '800', color: colors.text },
  textoElegido: { color: '#fff' },
  numeroHoy: { color: colors.brand },
  marca: { height: 7, justifyContent: 'center' },
  punto: { width: 5, height: 4, borderRadius: 2 },
  puntoLleno: { width: 14 },
});
