import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Apuntar, Quitar } from '@/components/apuntar';
import { AvisarAClase } from '@/components/avisar';
import { CancelarClase } from '@/components/cancelar-clase';
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
  const [avisando, setAvisando] = useState(false);
  const [cancelandoClase, setCancelandoClase] = useState(false);
  const [quitando, setQuitando] = useState<Apuntado | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState('');

  // Pasar lista se ofrece cuando la clase ya ha empezado. El servidor la deja
  // pasar desde el mismo día, pero a las diez de la mañana marcar quién vino a
  // la de las siete es adivinar.
  const pasandoLista = Boolean(clase?.lista && clase.empezada);

  async function marcar(que: { reserva: string; vino: boolean } | { vinieron_todos: true }) {
    if (!token || !clase || guardando) return;
    setGuardando(true);
    setFallo('');
    try {
      const { clase: actualizada } = await endpoints.pasarLista(token, clase.id, que);
      setRecien(actualizada);
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido guardar la lista.');
    } finally {
      setGuardando(false);
    }
  }

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
              ) : pasandoLista ? (
                // Ya no importa cuántas plazas había: importa quién vino.
                <Text style={styles.asistencia}>
                  {(clase.sin_marcar ?? 0) > 0
                    ? `${clase.sin_marcar} sin marcar de ${clase.apuntados.length}`
                    : clase.apuntados.length === 0
                      ? 'No había nadie apuntado'
                      : `Vino ${clase.vinieron ?? 0} de ${clase.apuntados.length}`}
                </Text>
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
            ) : pasandoLista ? (
              <View style={styles.acciones}>
                {/* Es lo que pasa en nueve de cada diez clases, y ahorra tocar
                    seis veces. Solo marca a los que faltaban: al que ya diste
                    por ausente no se le cambia a la espalda. */}
                {(clase.sin_marcar ?? 0) > 0 ? (
                  <Boton
                    titulo={
                      clase.sin_marcar === clase.apuntados.length
                        ? 'Vinieron todos'
                        : `Vinieron los ${clase.sin_marcar} que faltan`
                    }
                    onPress={() => marcar({ vinieron_todos: true })}
                  />
                ) : null}
              </View>
            ) : (
              <View style={styles.acciones}>
                <Boton
                  titulo={clase.libres > 0 ? 'Apuntar a alguien' : 'Apuntar de todas formas'}
                  variante={clase.libres > 0 ? 'principal' : 'secundario'}
                  onPress={() => setApuntando(true)}
                />
                {/* Solo si hay alguien a quien avisar: un botón que siempre
                    contesta «no hay nadie apuntado» no es un botón. */}
                {clase.apuntados.length > 0 && !clase.empezada ? (
                  <Boton
                    titulo="Avisar a los que vienen"
                    variante="suave"
                    onPress={() => setAvisando(true)}
                  />
                ) : null}
                {/* Cancelar va la última y en gris: es lo más grave que se hace
                    aquí, y no se llega a ella de un pulgar despistado. Una clase
                    que ya empezó no se cancela: eso ya pasó. */}
                {clase.puede_cancelar && !clase.empezada ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setCancelandoClase(true)}
                    style={({ pressed }) => [styles.cancelar, pressed && { opacity: 0.6 }]}>
                    <Text style={styles.cancelarTexto}>Cancelar la clase</Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            <Bloque
              titulo={pasandoLista ? 'Quién vino' : 'Quién viene'}
              coletilla={
                clase.apuntados.length === 0
                  ? undefined
                  : clase.apuntados.length === 1
                    ? '1 persona'
                    : `${clase.apuntados.length} personas`
              }>
              {clase.apuntados.length === 0 ? (
                <Text style={styles.vacio}>
                  {pasandoLista ? 'No había nadie apuntado.' : 'Nadie apuntado todavía.'}
                </Text>
              ) : (
                clase.apuntados.map((quien) => (
                  <Persona
                    key={quien.id}
                    quien={quien}
                    pasandoLista={pasandoLista}
                    guardando={guardando}
                    onMarcar={(vino) => marcar({ reserva: quien.id, vino })}
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
          <AvisarAClase visible={avisando} clase={clase} onClose={() => setAvisando(false)} />
          <CancelarClase
            visible={cancelandoClase}
            clase={clase}
            onClose={() => setCancelandoClase(false)}
            onCancelada={(actualizada) => { setRecien(actualizada); recargar(); }}
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

/**
 * Alguien de la lista.
 *
 * Tocar el nombre abre su ficha —«¿le queda bono?» se pregunta mirando a quien
 * tienes delante, que suele estar en la clase de ahora— y la ✕ le quita. La ✕
 * se queda con el toque: va encima y es la que decide.
 */
function Persona({
  quien, sePuedeQuitar, onQuitar, pasandoLista, guardando, onMarcar,
}: {
  quien: Apuntado;
  sePuedeQuitar: boolean;
  onQuitar: () => void;
  pasandoLista: boolean;
  guardando: boolean;
  onMarcar: (vino: boolean) => void;
}) {
  return (
    <View style={styles.persona}>
      {/* La ✕ va fuera del toque del nombre y no dentro: un botón metido en
          otro botón deja sin decidir cuál de los dos manda, y al lector de
          pantalla le suena como una sola cosa que hace dos. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver la ficha de ${quien.nombre}`}
        onPress={() => router.push(`/alumno/${quien.cliente}`)}
        style={({ pressed }) => [styles.personaToque, pressed && { opacity: 0.7 }]}>
        <Avatar nombre={quien.nombre} />
        <View style={styles.personaTexto}>
          <Text style={styles.personaNombre} numberOfLines={1}>{quien.nombre}</Text>
          <Text style={styles.personaPista} numberOfLines={1}>
            {quien.fijo ? 'Plaza fija' : quien.paga || 'Sin bono'}
          </Text>
        </View>
      </Pressable>
      {pasandoLista ? (
        // Dos botones y no un interruptor: un interruptor solo tiene «sí» y
        // «no», y aquí hace falta un tercer estado —«todavía no se sabe»— que
        // es el que sale cuando no hay ninguno de los dos pulsado.
        <View style={styles.marcar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${quien.nombre} vino`}
            accessibilityState={{ selected: quien.estado === 'attended' }}
            disabled={guardando}
            onPress={() => onMarcar(true)}
            style={({ pressed }) => [
              styles.marca,
              quien.estado === 'attended' && styles.marcaVino,
              pressed && { opacity: 0.7 },
            ]}>
            <Ionicons
              name="checkmark"
              size={19}
              color={quien.estado === 'attended' ? colors.success : colors.faint}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${quien.nombre} no vino`}
            accessibilityState={{ selected: quien.estado === 'no_show' }}
            disabled={guardando}
            onPress={() => onMarcar(false)}
            style={({ pressed }) => [
              styles.marca,
              quien.estado === 'no_show' && styles.marcaFalto,
              pressed && { opacity: 0.7 },
            ]}>
            <Ionicons
              name="close"
              size={19}
              color={quien.estado === 'no_show' ? colors.danger : colors.faint}
            />
          </Pressable>
        </View>
      ) : quien.estado === 'attended' ? (
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
  acciones: { gap: space.sm },
  asistencia: { fontSize: 15, fontWeight: '700', color: colors.muted, marginTop: space.md },
  marcar: { flexDirection: 'row', gap: space.sm },
  marca: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  marcaVino: { backgroundColor: colors.successSoft, borderColor: colors.success },
  marcaFalto: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  cancelar: { alignSelf: 'center', paddingVertical: space.md, paddingHorizontal: space.lg },
  cancelarTexto: { fontSize: 14, fontWeight: '700', color: colors.muted },
  aviso: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft },
  avisoTexto: { fontSize: 14, color: colors.danger, fontWeight: '600', lineHeight: 20 },
  bloque: { gap: space.sm },
  bloqueCabecera: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, paddingHorizontal: space.xs },
  bloqueTitulo: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  bloqueColetilla: { fontSize: 13, color: colors.faint, fontWeight: '600' },
  bloqueCard: { paddingVertical: space.sm },
  vacio: { fontSize: 14, color: colors.muted, paddingVertical: space.sm },
  persona: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  personaToque: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingVertical: space.sm,
  },
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
