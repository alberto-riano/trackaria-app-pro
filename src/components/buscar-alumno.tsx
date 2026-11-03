import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { Avatar, Boton } from '@/components/ui';
import { ApiError, endpoints, type AlumnoBuscado } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/** Lo que se tarda en dejar de teclear antes de preguntar al servidor. */
const ESPERA = 280;

/**
 * Buscar a alguien del centro, con la misma caja en todos los sitios.
 *
 * Se busca por nombre o por teléfono porque quien pregunta en el mostrador dice
 * una cosa o la otra, y porque dos Anas se distinguen por el número.
 *
 * `clase` hace dos cosas: marca a quien ya está dentro y trae con qué puede
 * pagar cada uno. Sin ella es una búsqueda a secas, para llegar a una ficha.
 */
export function useBusqueda(activa: boolean, clase?: string) {
  const { token } = useSession();
  const [busca, setBusca] = useState('');
  const [alumnos, setAlumnos] = useState<AlumnoBuscado[] | null>(null);
  const [vuelta, setVuelta] = useState(0);

  // Cada apertura empieza limpia: se abre para buscar a alguien, no para
  // seguir donde se quedó la vez anterior.
  useEffect(() => {
    if (activa) return;
    setBusca('');
    setAlumnos(null);
  }, [activa]);

  useEffect(() => {
    if (!activa || !token) return;
    let vigente = true;
    const reloj = setTimeout(() => {
      endpoints
        .alumnos(token, busca, clase)
        .then(({ alumnos: encontrados }) => { if (vigente) setAlumnos(encontrados); })
        .catch(() => { if (vigente) setAlumnos([]); });
    }, ESPERA);
    return () => { vigente = false; clearTimeout(reloj); };
  }, [activa, token, busca, clase, vuelta]);

  // Para volver a preguntar sin cambiar lo escrito: quien da de alta a alguien
  // desde otra pantalla espera encontrarlo aquí al volver, no una lista vieja.
  const refrescar = useCallback(() => setVuelta((antes) => antes + 1), []);

  return { busca, setBusca, alumnos, refrescar };
}

export function CampoDeBusqueda({
  valor, onCambiar, autoFocus = false,
}: {
  valor: string;
  onCambiar: (texto: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <View style={styles.buscador}>
      <Ionicons name="search" size={18} color={colors.faint} />
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        placeholder="Nombre o teléfono"
        placeholderTextColor={colors.faint}
        style={styles.campo}
        autoCorrect={false}
        autoCapitalize="words"
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      {valor ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Borrar" onPress={() => onCambiar('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.faint} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function FilaDeAlumno({
  alumno, pista, dentro = false, onPress,
}: {
  alumno: AlumnoBuscado;
  pista: string;
  /** Ya está en la clase: se ve, pero no se puede elegir. */
  dentro?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: dentro }}
      disabled={dentro}
      onPress={onPress}
      style={({ pressed }) => [styles.alumno, dentro && styles.alumnoDentro, pressed && !dentro && { opacity: 0.7 }]}>
      <Avatar nombre={alumno.nombre} />
      <View style={styles.alumnoTexto}>
        <Text style={styles.alumnoNombre} numberOfLines={1}>{alumno.nombre}</Text>
        <Text style={styles.alumnoPista} numberOfLines={1}>{pista}</Text>
      </View>
      {dentro ? (
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      )}
    </Pressable>
  );
}

/**
 * Lo que se enseña cuando la búsqueda no encuentra a nadie.
 *
 * Antes decía «los alumnos nuevos se dan de alta en el panel», que es mandar a
 * alguien al ordenador con una persona esperando delante. Ahora el camino sigue
 * aquí: el hueco de la búsqueda es justo donde hace falta el alta.
 */
export function NoEsta({ busca, onAlta }: { busca: string; onAlta: () => void }) {
  return (
    <View style={styles.noEsta}>
      <Text style={styles.vacio}>
        {busca
          ? 'Nadie con ese nombre ni ese teléfono.'
          : 'Todavía no hay alumnos en tu centro.'}
      </Text>
      <Boton titulo="Dar de alta a alguien nuevo" variante="suave" onPress={onAlta} />
    </View>
  );
}

/**
 * El alta de quien acaba de entrar por la puerta.
 *
 * Dos campos y ya. Apellidos, correo, dirección y consentimientos son papeleo
 * de otro momento: lo que hace falta ahora es poder apuntarle a la clase de las
 * siete. Lo demás se completa en el panel cuando haya un rato.
 */
export function AltaDeAlumno({
  nombreSugerido, onVolver, onAlta, volverTexto = 'Volver a buscar',
}: {
  /** Lo que ya había escrito en la búsqueda, para no teclearlo dos veces. */
  nombreSugerido: string;
  onVolver: () => void;
  onAlta: (alumno: { id: string; nombre: string; telefono: string }, yaEstaba: boolean) => void;
  /** Qué hay detrás. Desde una hoja que se abre sola no hay búsqueda a la que volver. */
  volverTexto?: string;
}) {
  const { token } = useSession();
  // Si lo que escribió lleva dígitos era un teléfono, no un nombre: el campo
  // que se precarga es el que toca, no siempre el primero.
  const parecePhone = /\d/.test(nombreSugerido);
  const [nombre, setNombre] = useState(parecePhone ? '' : nombreSugerido);
  const [telefono, setTelefono] = useState(parecePhone ? nombreSugerido : '');
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState('');

  const listo = nombre.trim().length > 0 && telefono.trim().length >= 6;

  async function crear() {
    if (!token || !listo || guardando) return;
    setGuardando(true);
    setFallo('');
    try {
      const { alumno, ya_estaba } = await endpoints.crearAlumno(token, nombre, telefono);
      onAlta(alumno, ya_estaba);
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido dar de alta.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    // En un ScrollView para poder arrastrar y quitar el teclado: tocar fuera
    // cierra la hoja entera, así que sin esto no hay forma de bajarlo.
    <ScrollView
      style={styles.cuerpo}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}>
      <Pressable
        accessibilityRole="button"
        onPress={onVolver}
        style={({ pressed }) => [styles.volver, pressed && { opacity: 0.7 }]}>
        <Ionicons name="chevron-back" size={18} color={colors.brandDark} />
        <Text style={styles.volverTexto}>{volverTexto}</Text>
      </Pressable>

      <Text style={styles.titulo}>Alguien nuevo</Text>
      <Text style={styles.coletilla}>
        Con el nombre y el teléfono basta para empezar. El resto de su ficha se
        completa en el panel.
      </Text>

      {fallo ? (
        <View style={styles.error} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorTexto}>{fallo}</Text>
        </View>
      ) : null}

      <View style={styles.formulario}>
        <Etiqueta texto="Nombre" />
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder="Como le llames"
          placeholderTextColor={colors.faint}
          style={styles.campoAlto}
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus={!parecePhone}
          returnKeyType="next"
        />

        <Etiqueta texto="Teléfono" />
        <TextInput
          value={telefono}
          onChangeText={setTelefono}
          placeholder="600 000 000"
          placeholderTextColor={colors.faint}
          style={styles.campoAlto}
          keyboardType="phone-pad"
          autoFocus={parecePhone}
          returnKeyType="done"
          onSubmitEditing={crear}
        />
        {/* Es con lo que esa persona entra en la app de alumnos, así que no es
            un dato de contacto más: sin él, el alta no le sirve de nada a ella. */}
        <Text style={styles.ayuda}>Con él entra en la app y recibe los avisos de sus clases.</Text>
      </View>

      <View style={styles.acciones}>
        <Boton
          titulo={guardando ? 'Dando de alta…' : 'Dar de alta'}
          variante={listo && !guardando ? 'principal' : 'secundario'}
          onPress={crear}
        />
      </View>
    </ScrollView>
  );
}

function Etiqueta({ texto }: { texto: string }) {
  return <Text style={styles.etiqueta}>{texto.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  cuerpo: { flexShrink: 1 },
  titulo: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  coletilla: { fontSize: 14, color: colors.muted, marginTop: 2, lineHeight: 20 },
  buscador: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: space.md, marginTop: space.lg,
  },
  campo: { flex: 1, paddingVertical: space.md, fontSize: 16, color: colors.text },
  alumno: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingVertical: space.sm + 2, paddingRight: space.xs,
  },
  alumnoDentro: { opacity: 0.55 },
  alumnoTexto: { flex: 1, gap: 2 },
  alumnoNombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  alumnoPista: { fontSize: 13, color: colors.muted },
  noEsta: { gap: space.md, marginTop: space.lg, marginBottom: space.xs },
  vacio: { fontSize: 14, color: colors.muted, lineHeight: 21 },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: space.sm, alignSelf: 'flex-start' },
  volverTexto: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
  formulario: { marginTop: space.lg, gap: space.xs },
  etiqueta: {
    fontSize: 12, fontWeight: '800', color: colors.faint,
    letterSpacing: 0.4, marginTop: space.sm,
  },
  campoAlto: {
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: space.md, paddingVertical: space.md,
    fontSize: 16, color: colors.text,
  },
  ayuda: { fontSize: 13, color: colors.faint, marginTop: space.xs, lineHeight: 18 },
  acciones: { gap: space.sm, marginTop: space.lg, marginBottom: space.sm },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md, marginTop: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
