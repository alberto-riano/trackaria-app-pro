import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Entrar con la cuenta del panel.
 *
 * Aquí no hay registro ni «he olvidado mi contraseña» a propósito: las cuentas
 * las crea el centro desde el panel, y esta app no es sitio para dar de alta a
 * nadie. Si alguien no puede entrar, lo arregla quien administra su clínica.
 */
export default function EntrarScreen() {
  const insets = useSafeAreaInsets();
  const { entrar } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verla, setVerla] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const listo = email.trim().length > 0 && password.length > 0;

  async function intentar() {
    if (!listo || enviando) return;
    setEnviando(true);
    setError('');
    try {
      await entrar(email.trim(), password);
    } catch (fallo) {
      setError(fallo instanceof ApiError ? fallo.message : 'No se ha podido entrar.');
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.contenido, { paddingTop: insets.top + space.xxl }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.marca}>
          <View style={styles.icono}>
            <Ionicons name="pulse" size={28} color={colors.brand} />
          </View>
          <Text style={styles.titulo}>Trackaria Pro</Text>
          <Text style={styles.coletilla}>Tu agenda y tu WhatsApp</Text>
        </View>

        <View style={styles.campos}>
          <Campo
            etiqueta="Correo"
            valor={email}
            onChange={setEmail}
            placeholder="tu@centro.com"
            autoComplete="email"
            keyboardType="email-address"
          />
          <View>
            <Campo
              etiqueta="Contraseña"
              valor={password}
              onChange={setPassword}
              placeholder="Tu contraseña del panel"
              autoComplete="current-password"
              secure={!verla}
              onSubmit={intentar}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={verla ? 'Ocultar la contraseña' : 'Ver la contraseña'}
              onPress={() => setVerla((actual) => !actual)}
              style={styles.ojo}>
              <Ionicons name={verla ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.faint} />
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.error} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorTexto}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={!listo || enviando}
          onPress={intentar}
          style={({ pressed }) => [
            styles.boton,
            (!listo || enviando) && styles.botonApagado,
            pressed && { opacity: 0.8 },
          ]}>
          {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Entrar</Text>}
        </Pressable>

        <Text style={styles.pie}>
          Es la misma cuenta con la que entras al panel de Trackaria. Si no puedes entrar, pídeselo a
          quien administra tu centro.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Campo({
  etiqueta, valor, onChange, placeholder, secure, autoComplete, keyboardType, onSubmit,
}: {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder: string;
  secure?: boolean;
  autoComplete?: 'email' | 'current-password';
  keyboardType?: 'email-address';
  onSubmit?: () => void;
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta.toUpperCase()}</Text>
      <TextInput
        style={styles.input}
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        returnKeyType={onSubmit ? 'go' : 'next'}
        onSubmitEditing={onSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.background },
  contenido: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },
  marca: { alignItems: 'center', gap: space.xs, marginBottom: space.lg },
  icono: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: space.sm,
  },
  titulo: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  coletilla: { fontSize: 15, color: colors.muted },
  campos: { gap: space.md },
  campo: { gap: 5 },
  etiqueta: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: colors.faint },
  input: {
    minHeight: 50, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md,
    fontSize: 16, color: colors.text,
  },
  ojo: { position: 'absolute', right: 4, bottom: 0, height: 50, width: 44, alignItems: 'center', justifyContent: 'center' },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
  boton: {
    minHeight: 52, borderRadius: radius.md, backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  botonApagado: { backgroundColor: colors.faint },
  botonTexto: { fontSize: 16, fontWeight: '700', color: '#fff' },
  pie: { fontSize: 13, color: colors.faint, textAlign: 'center', lineHeight: 19 },
});
