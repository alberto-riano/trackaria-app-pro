import { type ReactNode, useEffect, useRef } from 'react';
import {
  Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet,
  useWindowDimensions, View,
} from 'react-native';
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

/**
 * Hoja que sube desde abajo: para elegir algo o decidir algo.
 *
 * Va dentro de un `KeyboardAvoidingView` porque varias de estas hojas tienen un
 * campo de texto, y una hoja pegada al borde de abajo es exactamente lo que
 * tapa el teclado al abrirse: se escribía el nombre de alguien sin ver ni lo
 * escrito ni los resultados. Así la hoja sube con el teclado y se queda entera
 * a la vista.
 */
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
      {/* `box-none` para que lo de arriba de la hoja siga siendo el fondo que
          la cierra: el contenedor ocupa toda la pantalla, pero no la toca. */}
      <KeyboardAvoidingView
        style={styles.pegadoAbajo}
        pointerEvents="box-none"
        // En Android el propio sistema redimensiona la ventana, y encima
        // «height» pelea con `statusBarTranslucent` y deja la hoja a medias.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Tarjeta en el centro de la pantalla.
 *
 * Para leer algo, y para los formularios cortos. Una hoja pegada al borde de
 * abajo con un campo de texto tiene un problema que no se puede arreglar desde
 * dentro: está justo donde sale el teclado, así que en cuanto se escribe sube
 * entera, y el salto es tan alto como el teclado. Centrada, el teclado le quita
 * sitio por abajo y la tarjeta se recoloca en lo que queda, que se mueve mucho
 * menos y nunca se lee como un salto.
 */
export function CenterCard({ visible, onClose, children, cerrarLabel = 'Cerrar' }: Props) {
  const { valor, cerrar } = useApertura(visible, onClose);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={cerrar} statusBarTranslucent>
      <Animated.View style={[styles.fondo, { opacity: valor }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} accessibilityLabel={cerrarLabel} />
      </Animated.View>
      <KeyboardAvoidingView
        style={styles.centro}
        pointerEvents="box-none"
        // Lo mismo que en la hoja: en Android el sistema ya redimensiona la
        // ventana, y «height» pelea con `statusBarTranslucent`.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,24,39,0.45)' },
  pegadoAbajo: { flex: 1, justifyContent: 'flex-end' },
  hoja: {
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
