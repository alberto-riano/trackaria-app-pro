import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space } from '@/lib/theme';

const ENTRADA = 260;
const SALIDA = 200;

/**
 * Lo que se abre encima de una pantalla.
 *
 * El `animationType="slide"` del Modal sube **todo** de abajo arriba, fondo
 * oscuro incluido: se veía un barrido negro cruzando la pantalla. Aquí el fondo
 * se funde y solo sube la hoja, que es como se mueve iOS.
 */
function useApertura(visible: boolean, onClosed: () => void) {
  const valor = useRef(new Animated.Value(0)).current;
  const cerrando = useRef(false);

  useEffect(() => {
    if (!visible) return;
    cerrando.current = false;
    valor.setValue(0);
    Animated.timing(valor, {
      toValue: 1,
      duration: ENTRADA,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, valor]);

  function cerrar() {
    if (cerrando.current) return;
    cerrando.current = true;
    Animated.timing(valor, {
      toValue: 0,
      duration: SALIDA,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onClosed());
  }

  return { valor, cerrar };
}

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Qué lee el lector de pantalla al tocar el fondo. */
  cerrarLabel?: string;
};

/** Hoja que sube desde abajo: para elegir algo o decidir algo. */
export function BottomSheet({ visible, onClose, children, cerrarLabel = 'Cerrar' }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { valor, cerrar } = useApertura(visible, onClose);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={cerrar} statusBarTranslucent>
      <Animated.View style={[styles.fondo, { opacity: valor }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} accessibilityLabel={cerrarLabel} />
      </Animated.View>
      <Animated.View
        style={[
          styles.hoja,
          {
            paddingBottom: insets.bottom + space.lg,
            transform: [{
              translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [height * 0.5, 0] }),
            }],
          },
        ]}>
        <View style={styles.asa} />
        {children}
      </Animated.View>
    </Modal>
  );
}

/** Tarjeta en el centro: para leer algo, no para decidir nada. */
export function CenterCard({ visible, onClose, children, cerrarLabel = 'Cerrar' }: Props) {
  const { valor, cerrar } = useApertura(visible, onClose);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={cerrar} statusBarTranslucent>
      <Animated.View style={[styles.fondo, { opacity: valor }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} accessibilityLabel={cerrarLabel} />
      </Animated.View>
      <View style={styles.centro} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.tarjeta,
            {
              opacity: valor,
              // Un pelín de escala al entrar: aparecer de golpe se lee como un salto.
              transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
            },
          ]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,24,39,0.45)' },
  hoja: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  asa: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: space.md },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  tarjeta: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
  },
});
