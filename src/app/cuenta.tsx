import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Quién eres y poco más.
 *
 * Aquí no hay ajustes a propósito: el bot, los horarios, los profesionales, la
 * suscripción y el soporte se tocan en el panel, que es donde se ven las
 * consecuencias de cambiarlos. Esta pantalla solo dice con qué cuenta estás
 * dentro y te deja salir.
 */
export default function CuentaScreen() {
  const { usuario, salir } = useSession();

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Stack.Screen options={{ title: 'Tu cuenta', headerBackButtonDisplayMode: 'minimal' }} />

      <Card style={styles.ficha}>
        <View style={styles.icono}>
          <Ionicons name="person" size={26} color={colors.brand} />
        </View>
        <Text style={styles.nombre}>{usuario?.nombre}</Text>
        <Text style={styles.email}>{usuario?.email}</Text>
        <View style={styles.centro}>
          <Ionicons name="business-outline" size={16} color={colors.muted} />
          <Text style={styles.centroTexto}>{usuario?.centro.nombre}</Text>
        </View>
      </Card>

      <View style={styles.nota}>
        <Ionicons name="desktop-outline" size={18} color={colors.muted} />
        <Text style={styles.notaTexto}>
          Los horarios, el bot, los profesionales y la facturación se gestionan desde el panel de
          Trackaria, en el ordenador.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={salir}
        style={({ pressed }) => [styles.salir, pressed && { opacity: 0.7 }]}>
        <Text style={styles.salirTexto}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, gap: space.lg },
  ficha: { alignItems: 'center', gap: space.xs },
  icono: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: space.sm,
  },
  nombre: { fontSize: 20, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.muted },
  centro: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.sm },
  centroTexto: { fontSize: 15, fontWeight: '700', color: colors.text },
  nota: {
    flexDirection: 'row', gap: space.md, alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: space.lg,
  },
  notaTexto: { flex: 1, fontSize: 14, color: colors.muted, lineHeight: 20 },
  salir: {
    minHeight: 50, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  salirTexto: { fontSize: 16, fontWeight: '700', color: colors.danger },
});
