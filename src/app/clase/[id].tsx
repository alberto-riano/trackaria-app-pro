import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Apuntar, Quitar } from '@/components/apuntar';
import { Insignia, Plazas } from '@/components/clase-ui';
import { Avatar, Boton, Card, Chip } from '@/components/ui';
import { ApiError, endpoints, type Apuntado, type ClaseDetalle } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { comoFecha, dayTitle } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Una clase por dentro: quién está dentro y quién espera.
 *
 * Es lo único de la app que **cambia** datos de clases, y solo dos cosas:
 * apuntar y quitar. Las dos se hacen con alguien delante preguntando, que es
 * justo lo que no puede esperar a llegar al ordenador. Horarios, instructores y
 * plazas siguen en el panel.
 */
export default function ClaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useSession();
  const { datos, error, recargar } = useDatos(
    useCallback((clave: string) => endpoints.clase(clave, id), [id]),
  );

  // Lo que devuelve apuntar o quitar manda sobre lo cargado: el servidor ya
  // contesta con la clase entera, así que pedirla otra vez es un viaje de más
  // y un parpadeo con el alumno delante.
  const [recien, setRecien] = useState<ClaseDetalle | null>(null);
  const clase = recien ?? datos?.clase ?? null;

  const [apuntando, setApuntando] = useState(false);
  const [quitando, setQuitando] = useState<Apuntado | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState('');

  async function quitar(devolver?: boolean) {
    if (!token || !clase || !quitando || guardando) return;
    setGuardando(true);
    setFallo('');
    try {
      const { clase: actualizada } = await endpoints.quitar(token, clase.id, quitando.id, devolver);
      setRecien(actualizada);
      setQuitando(null);
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido quitar.');
      setQuitando(null);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Stack.Screen options={{ title: 'Clase', headerBackButtonDisplayMode: 'minimal' }} />

        {error || fallo ? (
          <View style={styles.error} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorTexto}>{error || fallo}</Text>
          </View>
        ) : null}

        {clase === null ? (
          <ActivityIndicator color={colors.brand} style={styles.cargando} />
        ) : (
          <>
            <Card style={styles.cabecera}>
              <Insignia nombre={clase.nombre} color={clase.color} imagen={clase.imagen} tamano={64} />
              <Text style={styles.nombre}>{clase.nombre}</Text>
              <Text style={styles.cuando}>
                {dayTitle(comoFecha(clase.fecha))} · {clase.hora}–{clase.fin}
              </Text>
              {clase.instructor || clase.sala ? (
                <Text style={styles.detalle}>
                  {[clase.instructor, clase.sala].filter(Boolean).join('  ·  ')}
                </Text>
              ) : null}
              {clase.cancelada ? (
                <View style={styles.chips}>
                  <Chip label="Cancelada" tone="danger" />
                </View>
              ) : (
                <View style={styles.medidor}>
                  <Plazas ocupadas={clase.ocupadas} plazas={clase.plazas} />
                </View>
              )}
            </Card>

            {clase.cancelada ? (
              <Card style={styles.aviso}>
                <Text style={styles.avisoTexto}>
                  {clase.motivo || 'Esta clase está cancelada.'}
                </Text>
              </Card>
            ) : (
              <Boton
                titulo={clase.libres > 0 ? 'Apuntar a alguien' : 'Apuntar de todas formas'}
                variante={clase.libres > 0 ? 'principal' : 'secundario'}
                onPress={() => setApuntando(true)}
              />
            )}

            <Bloque
              titulo="Quién viene"
              coletilla={
                clase.apuntados.length === 0
                  ? undefined
                  : clase.apuntados.length === 1
                    ? '1 persona'
                    : `${clase.apuntados.length} personas`
              }>
              {clase.apuntados.length === 0 ? (
                <Text style={styles.vacio}>Nadie apuntado todavía.</Text>
              ) : (
                clase.apuntados.map((quien) => (
                  <Persona
                    key={quien.id}
                    quien={quien}
                    // Una clase que ya pasó es historial: quitar a alguien de
                    // ayer no le libera ninguna plaza, solo borra lo que ocurrió.
                    sePuedeQuitar={!clase.empezada}
                    onQuitar={() => setQuitando(quien)}
                  />
                ))
              )}
            </Bloque>

            {clase.espera.length > 0 ? (
              <Bloque
                titulo="En lista de espera"
                coletilla={clase.espera.length === 1 ? '1 persona' : `${clase.espera.length} personas`}>
                {clase.espera.map((quien) => (
                  <View key={quien.id} style={styles.persona}>
                    <Avatar nombre={quien.nombre} tono={quien.ofrecida ? 'alerta' : 'neutral'} />
                    <View style={styles.personaTexto}>
                      <Text style={styles.personaNombre} numberOfLines={1}>{quien.nombre}</Text>
                      <Text style={styles.personaPista}>
                        {quien.ofrecida ? 'Tiene la plaza ofrecida ahora mismo' : 'Esperando una plaza'}
                      </Text>
                    </View>
                  </View>
                ))}
              </Bloque>
            ) : null}
          </>
        )}
      </ScrollView>

      {clase ? (
        <>
          <Apuntar
            visible={apuntando}
            clase={clase}
            onClose={() => setApuntando(false)}
            onApuntado={(actualizada) => { setRecien(actualizada); recargar(); }}
          />
          <Quitar
            visible={quitando !== null}
            nombre={quitando?.nombre ?? ''}
            paga={quitando?.paga ?? ''}
            aTiempo={clase.devuelve}
            guardando={guardando}
            onClose={() => setQuitando(null)}
            onQuitar={quitar}
          />
        </>
      ) : null}
    </>
  );
}

function Persona({
  quien, sePuedeQuitar, onQuitar,
}: {
  quien: Apuntado;
  sePuedeQuitar: boolean;
  onQuitar: () => void;
}) {
  return (
    <View style={styles.persona}>
      <Avatar nombre={quien.nombre} />
      <View style={styles.personaTexto}>
        <Text style={styles.personaNombre} numberOfLines={1}>{quien.nombre}</Text>
        <Text style={styles.personaPista} numberOfLines={1}>
          {quien.fijo ? 'Plaza fija' : quien.paga || 'Sin bono'}
        </Text>
      </View>
      {quien.estado === 'attended' ? (
        <Chip label="Vino" tone="success" />
      ) : quien.estado === 'no_show' ? (
        <Chip label="No vino" tone="danger" />
      ) : sePuedeQuitar ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Quitar a ${quien.nombre}`}
          onPress={onQuitar}
          hitSlop={8}
          style={({ pressed }) => [styles.quitar, pressed && { opacity: 0.6 }]}>
          <Ionicons name="close" size={16} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Bloque({
  titulo, coletilla, children,
}: {
  titulo: string;
  coletilla?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.bloque}>
      <View style={styles.bloqueCabecera}>
        <Text style={styles.bloqueTitulo}>{titulo}</Text>
        {coletilla ? <Text style={styles.bloqueColetilla}>{coletilla}</Text> : null}
      </View>
      <Card style={styles.bloqueCard}>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, paddingBottom: space.xxl, gap: space.lg },
  cargando: { marginTop: space.xxl },
  cabecera: { alignItems: 'center', gap: space.xs },
  nombre: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: space.sm, letterSpacing: -0.3 },
  cuando: { fontSize: 15, fontWeight: '600', color: colors.muted },
  detalle: { fontSize: 14, color: colors.faint },
  chips: { marginTop: space.sm },
  medidor: { alignSelf: 'stretch', marginTop: space.md, paddingHorizontal: space.xl },
  aviso: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft },
  avisoTexto: { fontSize: 14, color: colors.danger, fontWeight: '600', lineHeight: 20 },
  bloque: { gap: space.sm },
  bloqueCabecera: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, paddingHorizontal: space.xs },
  bloqueTitulo: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  bloqueColetilla: { fontSize: 13, color: colors.faint, fontWeight: '600' },
  bloqueCard: { paddingVertical: space.sm },
  vacio: { fontSize: 14, color: colors.muted, paddingVertical: space.sm },
  persona: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  personaTexto: { flex: 1, gap: 2 },
  personaNombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  personaPista: { fontSize: 13, color: colors.muted },
  quitar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
