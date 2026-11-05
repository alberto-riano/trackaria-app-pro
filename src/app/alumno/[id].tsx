import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AjustarBono } from '@/components/ajustar-bono';
import { ApuntarAGrupo } from '@/components/apuntar-a-grupo';
import { DarBono } from '@/components/dar-bono';
import { Avatar, Boton, Card } from '@/components/ui';
import { endpoints, type Alumno, type Bono, type ClaseSuya } from '@/lib/api';
import { useDatos } from '@/lib/datos';
import { comoFecha, dayTitle } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * La ficha de un alumno, como se pregunta en el mostrador.
 *
 * El orden es el de la conversación: primero «¿me queda bono?», que es lo que
 * trae aquí a casi todo el mundo, y después a qué viene y a qué vino. Teléfono,
 * dirección y consentimientos no están: eso se consulta sentado, no de pie.
 *
 * Todo es de lectura menos darle un bono, que es la otra mitad de la misma
 * escena: no le queda, se lo vendes y le apuntas sin soltar el móvil.
 */
export default function AlumnoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useSession();
  const { datos, error, recargar } = useDatos(
    useCallback((token: string) => endpoints.alumno(token, id), [id]),
  );

  // Lo que devuelve dar un bono manda sobre lo cargado: el servidor contesta
  // con la ficha entera, así que volver a pedirla es un viaje de más.
  const [recien, setRecien] = useState<Alumno | null>(null);
  const alumno = recien ?? datos?.alumno ?? null;
  const [dandoBono, setDandoBono] = useState(false);
  const [ajustando, setAjustando] = useState<Bono | null>(null);
  const [apuntando, setApuntando] = useState(false);
  const [reciénApuntado, setReciénApuntado] = useState('');

  const hayBonos = usuario?.centro.bonos !== false;
  // Un centro puede llevar bonos, mensualidades o las dos cosas. Sin el campo
  // es que el servidor todavía no lo manda, y entonces no se enseña: un botón
  // que no va a ninguna parte es peor que un botón de menos.
  const hayCuotas = usuario?.centro.mensualidades === true;
  const clasesDeBono = (alumno?.bonos ?? []).reduce((suma, bono) => suma + bono.quedan, 0);
  const favores = (alumno?.mensualidades ?? []).reduce((suma, cuota) => suma + cuota.favores, 0);

  return (
    <>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Stack.Screen options={{ title: 'Alumno', headerBackButtonDisplayMode: 'minimal' }} />

        {error ? (
          <View style={styles.error} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorTexto}>{error}</Text>
          </View>
        ) : null}

        {alumno === null ? (
          <ActivityIndicator color={colors.brand} style={styles.cargando} />
        ) : (
          <>
            <Card style={styles.cabecera}>
              <Avatar nombre={alumno.nombre} />
              <Text style={styles.nombre}>{alumno.nombre}</Text>
              {alumno.telefono ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Llamar a ${alumno.nombre}`}
                  onPress={() => Linking.openURL(`tel:${alumno.telefono}`)}
                  style={({ pressed }) => [styles.telefono, pressed && { opacity: 0.7 }]}>
                  <Ionicons name="call-outline" size={15} color={colors.brandDark} />
                  <Text style={styles.telefonoTexto}>{alumno.telefono}</Text>
                </Pressable>
              ) : null}

              {/* La respuesta a «¿me queda bono?», en grande y sin sumar nada.
                  Todo lo demás de esta pantalla es el detalle de esta línea. */}
              <View style={styles.saldo}>
                <Text style={styles.saldoNumero}>{clasesDeBono + favores}</Text>
                <Text style={styles.saldoPie}>
                  {clasesDeBono + favores === 1 ? 'clase disponible' : 'clases disponibles'}
                </Text>
              </View>
            </Card>

            {hayBonos ? (
              <Boton
                titulo={alumno.bonos.length === 0 ? 'Darle un bono' : 'Darle otro bono'}
                variante={clasesDeBono === 0 ? 'principal' : 'suave'}
                onPress={() => setDandoBono(true)}
              />
            ) : null}

            {hayCuotas ? (
              <Boton
                titulo={alumno.mensualidades.length === 0 ? 'Hacerle alumno fijo' : 'Apuntarle a otro grupo'}
                variante="suave"
                onPress={() => setApuntando(true)}
              />
            ) : null}

            {/* Lo que ha pasado de verdad, no «hecho». Una clase llena no
                cancela el alta pero hay que decirlo ahora, no que se entere el
                martes cuando llegue y no haya sitio. */}
            {reciénApuntado ? (
              <View style={styles.hecho} accessibilityRole="alert">
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.hechoTexto}>{reciénApuntado}</Text>
              </View>
            ) : null}

            {alumno.bonos.length > 0 ? (
              <Bloque titulo="Sus bonos">
                {alumno.bonos.map((bono) => (
                  <FilaDeBono key={bono.id} bono={bono} onPress={() => setAjustando(bono)} />
                ))}
              </Bloque>
            ) : null}

            {alumno.mensualidades.length > 0 ? (
              <Bloque titulo={alumno.mensualidades.length === 1 ? 'Su cuota' : 'Sus cuotas'}>
                {alumno.mensualidades.map((cuota) => (
                  <View key={cuota.id} style={styles.fila}>
                    <View style={styles.icono}>
                      <Ionicons name="repeat-outline" size={18} color={colors.brandDark} />
                    </View>
                    <View style={styles.filaTexto}>
                      <Text style={styles.filaTitulo}>Plaza fija</Text>
                      <Text style={styles.filaPie}>
                        {cuota.hasta
                          ? `Hasta el ${dayTitle(comoFecha(cuota.hasta)).toLowerCase()}`
                          : 'Sin fecha de fin'}
                        {cuota.favores > 0
                          ? `  ·  ${cuota.favores === 1 ? '1 clase a favor' : `${cuota.favores} clases a favor`}`
                          : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </Bloque>
            ) : null}

            <Bloque titulo="Próximas clases">
              {alumno.proximas.length === 0 ? (
                <Text style={styles.vacio}>No está apuntado a nada por ahora.</Text>
              ) : (
                alumno.proximas.map((clase) => <FilaDeClase key={clase.id} clase={clase} />)
              )}
            </Bloque>

            {alumno.ultimas && alumno.ultimas.length > 0 ? (
              <Bloque titulo="Historial">
                {alumno.ultimas.map((clase) => <FilaDeClase key={clase.id} clase={clase} pasada />)}
              </Bloque>
            ) : null}
          </>
        )}
      </ScrollView>

      {alumno ? (
        <>
          <DarBono
            visible={dandoBono}
            alumno={alumno}
            onClose={() => setDandoBono(false)}
            onDado={(actualizado) => { setRecien(actualizado); recargar(); }}
          />
          <AjustarBono
            bono={ajustando}
            alumno={alumno}
            onClose={() => setAjustando(null)}
            onCambiado={(actualizado) => { setRecien(actualizado); recargar(); }}
          />
          <ApuntarAGrupo
            visible={apuntando}
            alumno={alumno}
            onClose={() => setApuntando(false)}
            onApuntado={(actualizado, reservadas, llenas) => {
              setRecien(actualizado);
              recargar();
              setReciénApuntado(
                llenas > 0
                  ? `Apuntado. Tiene ${reservadas} plazas reservadas y en ${llenas} no cabía: esas hay que mirarlas.`
                  : `Apuntado. Ya tiene ${reservadas} plazas reservadas.`,
              );
            }}
          />
        </>
      ) : null}
    </>
  );
}

function FilaDeBono({ bono, onPress }: { bono: Bono; onPress: () => void }) {
  const gastadas = Math.max(0, bono.total - bono.quedan);
  const parte = bono.total > 0 ? Math.min(1, gastadas / bono.total) : 0;
  const agotado = bono.quedan <= 0;
  return (
    // Se abre para arreglarlo: «me cobraste una de más» se dice aquí, delante
    // del número que no cuadra, y antes había que acordarse de ello por la
    // noche con el panel abierto.
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ajustar ${bono.nombre}`}
      onPress={onPress}
      style={({ pressed }) => [styles.bono, pressed && { opacity: 0.7 }]}>
      <View style={styles.bonoFila}>
        <View style={styles.filaTexto}>
          <Text style={styles.filaTitulo} numberOfLines={1}>{bono.nombre}</Text>
          <Text style={styles.filaPie}>
            {bono.clase ? `Solo para ${bono.clase}` : 'Vale para cualquier clase'}
          </Text>
        </View>
        <Text style={[styles.bonoCuenta, agotado && { color: colors.faint }]}>
          {agotado ? 'Gastado' : `${bono.quedan} de ${bono.total}`}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.faint} />
      </View>
      {/* La barra cuenta lo gastado, no lo que queda: lo que se mira de reojo
          es cuánto le falta para tener que comprar otro. */}
      <View style={styles.barra}>
        <View
          style={[
            styles.relleno,
            { width: `${parte * 100}%`, backgroundColor: agotado ? colors.faint : colors.brand },
          ]}
        />
      </View>
    </Pressable>
  );
}

function FilaDeClase({ clase, pasada = false }: { clase: ClaseSuya; pasada?: boolean }) {
  const vino = clase.vino;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${clase.nombre}, ${dayTitle(comoFecha(clase.fecha))} a las ${clase.hora}`}
      onPress={() => router.push(`/clase/${clase.id}`)}
      style={({ pressed }) => [styles.fila, pressed && { opacity: 0.7 }]}>
      <View style={[styles.icono, pasada && styles.iconoApagado]}>
        {pasada ? (
          <Ionicons
            name={vino === true ? 'checkmark' : vino === false ? 'close' : 'remove'}
            size={18}
            color={vino === true ? colors.success : vino === false ? colors.danger : colors.faint}
          />
        ) : (
          <Ionicons name="calendar-outline" size={18} color={colors.brandDark} />
        )}
      </View>
      <View style={styles.filaTexto}>
        <Text style={styles.filaTitulo} numberOfLines={1}>{clase.nombre}</Text>
        <Text style={styles.filaPie}>
          {dayTitle(comoFecha(clase.fecha))} · {clase.hora}
          {/* Una clase pasada sin lista no dice que faltara: dice que no se sabe. */}
          {pasada && vino === null ? '  ·  sin pasar lista' : ''}
          {pasada && vino === false ? '  ·  no vino' : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.faint} />
    </Pressable>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.bloque}>
      <Text style={styles.bloqueTitulo}>{titulo.toUpperCase()}</Text>
      <Card style={styles.bloqueCard}>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: space.lg, paddingBottom: space.xxl, gap: space.lg },
  cargando: { marginTop: space.xxl },
  cabecera: { alignItems: 'center', gap: space.xs },
  nombre: {
    fontSize: 22, fontWeight: '800', color: colors.text,
    marginTop: space.sm, letterSpacing: -0.3, textAlign: 'center',
  },
  telefono: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingVertical: space.xs },
  telefonoTexto: { fontSize: 15, fontWeight: '700', color: colors.brandDark },
  saldo: {
    alignItems: 'center', alignSelf: 'stretch', gap: 2,
    marginTop: space.md, paddingTop: space.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  saldoNumero: { fontSize: 34, fontWeight: '800', color: colors.brand, letterSpacing: -1 },
  saldoPie: { fontSize: 13, fontWeight: '600', color: colors.muted },
  bloque: { gap: space.sm },
  bloqueTitulo: {
    fontSize: 13, fontWeight: '800', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: space.xs,
  },
  bloqueCard: { paddingVertical: space.sm },
  vacio: { fontSize: 14, color: colors.muted, paddingVertical: space.sm },
  hecho: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.successSoft, borderRadius: radius.md, padding: space.md,
  },
  hechoTexto: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  icono: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  iconoApagado: { backgroundColor: colors.background },
  filaTexto: { flex: 1, gap: 2 },
  filaTitulo: { fontSize: 16, fontWeight: '700', color: colors.text },
  filaPie: { fontSize: 13, color: colors.muted },
  bono: { paddingVertical: space.sm, gap: space.sm },
  bonoFila: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bonoCuenta: { fontSize: 14, fontWeight: '800', color: colors.brandDark },
  barra: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  relleno: { height: 5, borderRadius: 3 },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
