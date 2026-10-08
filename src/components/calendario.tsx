import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/overlay';
import { endpoints } from '@/lib/api';
import { comoFecha, inicioDeMes, mismoMes, moverMes, semanasDelMes, tituloDeMes } from '@/lib/format';
import { useSession } from '@/lib/session';
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
  const { token } = useSession();
  const [mes, setMes] = useState(() => inicioDeMes(elegido));
  const [conCitas, setConCitas] = useState<Record<string, boolean>>({});

  // Si se abre desde otro día, empieza por su mes y no por el último que se miró.
  useEffect(() => {
    if (visible) setMes(inicioDeMes(elegido));
  }, [visible, elegido]);

  // Los días con algo, del mes que se está mirando. Sin esto, elegir una fecha
  // es ir probando a ciegas hasta dar con un día que tenga pacientes.
  useEffect(() => {
    if (!visible || !token) return;
    let vigente = true;
    const semanas = semanasDelMes(mes);
    const desde = semanas[0][0];
    const hasta = semanas[semanas.length - 1][6];
    endpoints
      .carga(token, desde, hasta)
      .then(({ carga }) => {
        if (vigente) setConCitas(Object.fromEntries(carga.map((dia) => [dia.fecha, true])));
      })
      // Si falla, el calendario sigue sirviendo para elegir día: solo se queda
      // sin los puntos.
      .catch(() => {});
    return () => { vigente = false; };
  }, [visible, mes, token]);

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
                <View style={styles.marca}>
                  {conCitas[iso] ? (
                    <View style={[styles.punto, activo && styles.puntoElegido]} />
                  ) : null}
                </View>
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
  celda: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, gap: 2 },
  marca: { height: 5, justifyContent: 'center' },
  punto: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.brand },
  puntoElegido: { backgroundColor: '#fff' },
  celdaElegida: { backgroundColor: colors.brand },
  numero: { fontSize: 16, fontWeight: '600', color: colors.text },
  numeroFuera: { color: colors.faint },
  numeroElegido: { color: '#fff', fontWeight: '800' },
  numeroHoy: { color: colors.brand, fontWeight: '800' },
});
