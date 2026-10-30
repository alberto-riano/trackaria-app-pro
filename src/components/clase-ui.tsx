import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space } from '@/lib/theme';

/**
 * Lo que comparten la lista de clases y la clase por dentro.
 *
 * El icono de la clase no se dibuja: el panel guarda iconos de Material Symbols,
 * que son trazos SVG, y traerse `react-native-svg` por un cuadradito de 44
 * puntos es meter una dependencia nativa —y con ella una build nueva cada vez
 * que algo la toque—. Con foto se enseña la foto; sin foto, la inicial sobre su
 * color, que es la misma pista que da el icono: distinguir Pilates de Yoga en
 * una lista.
 */
export function Insignia({
  nombre, color, imagen, tamano = 44,
}: {
  nombre: string;
  color: string;
  imagen?: string;
  tamano?: number;
}) {
  const estilo = { width: tamano, height: tamano, borderRadius: radius.md };
  if (imagen) {
    return <Image source={{ uri: imagen }} style={[estilo, styles.foto]} accessibilityIgnoresInvertColors />;
  }
  const tinte = color || colors.brand;
  return (
    <View style={[estilo, styles.inicial, { backgroundColor: `${tinte}1f` }]}>
      <Text style={[styles.inicialTexto, { color: tinte, fontSize: tamano * 0.42 }]}>
        {(nombre.trim()[0] || '?').toUpperCase()}
      </Text>
    </View>
  );
}

/**
 * Las plazas, como barra y como número.
 *
 * El número solo no se lee de reojo —«5/8» hay que pararse a restarlo— y la
 * barra sola no dice cuántas quedan cuando hay que decidir si cabe uno más.
 */
export function Plazas({
  ocupadas, plazas, compacto = false,
}: {
  ocupadas: number;
  plazas: number;
  compacto?: boolean;
}) {
  const llena = ocupadas >= plazas;
  const parte = plazas > 0 ? Math.min(1, ocupadas / plazas) : 0;
  const tinte = llena ? colors.warning : colors.brand;
  return (
    <View style={[styles.plazas, compacto && styles.plazasCompacto]}>
      <View style={styles.barra}>
        <View style={[styles.relleno, { width: `${parte * 100}%`, backgroundColor: tinte }]} />
      </View>
      <Text style={[styles.cuenta, { color: llena ? colors.warning : colors.muted }]}>
        {llena ? 'Completa' : `${ocupadas}/${plazas}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  foto: { backgroundColor: colors.border },
  inicial: { alignItems: 'center', justifyContent: 'center' },
  inicialTexto: { fontWeight: '800' },
  plazas: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  plazasCompacto: { gap: space.xs },
  barra: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  relleno: { height: 4, borderRadius: 2 },
  cuenta: { fontSize: 12, fontWeight: '700', minWidth: 54, textAlign: 'right' },
});
