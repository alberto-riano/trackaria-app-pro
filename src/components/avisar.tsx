import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { BottomSheet } from '@/components/overlay';
import { Boton } from '@/components/ui';
import { ApiError, endpoints, type AvisoEnviado, type ClaseDetalle, type ParaQuien } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Un aviso a los alumnos: «el jueves es festivo».
 *
 * Lo que convierte esto en algo que se hace desde el móvil es cuándo se hace:
 * cuando te enteras de que hay que avisar, que casi nunca es estando sentado en
 * el ordenador del centro.
 *
 * El aviso viaja por la app de alumnos, así que antes de enviarlo se dice a
 * cuántos les va a llegar de verdad: «son 18, pero solo 12 tienen la app». Dar
 * por avisado a medio centro es peor que no avisar, porque nadie lo sabe.
 */
export function Avisar({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { token } = useSession();
  const [opciones, setOpciones] = useState<ParaQuien[] | null>(null);
  const [ultimo, setUltimo] = useState<AvisoEnviado | null>(null);
  const [para, setPara] = useState('all');
  const [eligiendo, setEligiendo] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [cuenta, setCuenta] = useState<{ personas: number; con_app: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState('');
  const [enviado, setEnviado] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setPara('all');
    setTitulo('');
    setTexto('');
    setFallo('');
    setEnviado(0);
    setEligiendo(false);
  }, [visible]);

  useEffect(() => {
    if (!visible || !token || opciones !== null) return;
    let vigente = true;
    endpoints
      .avisos(token)
      .then(({ opciones: posibles, avisos }) => {
        if (!vigente) return;
        setOpciones(posibles);
        setUltimo(avisos[0] ?? null);
      })
      .catch(() => { if (vigente) setOpciones([]); });
    return () => { vigente = false; };
  }, [visible, token, opciones]);

  // La cuenta se vuelve a pedir cada vez que cambia el «para»: es el número que
  // hay que mirar antes de enviar, y uno viejo engaña más que ninguno.
  useEffect(() => {
    if (!visible || !token) return;
    let vigente = true;
    setCuenta(null);
    endpoints
      .destinatarios(token, para)
      .then((datos) => { if (vigente) setCuenta(datos); })
      .catch(() => { if (vigente) setCuenta(null); });
    return () => { vigente = false; };
  }, [visible, token, para]);

  const elegida = (opciones ?? []).find((opcion) => opcion.clave === para) ?? null;
  const listo = titulo.trim().length > 0 && texto.trim().length > 0 && (cuenta?.personas ?? 0) > 0;

  async function enviar() {
    if (!token || !listo || enviando) return;
    setEnviando(true);
    setFallo('');
    try {
      const { personas } = await endpoints.enviarAviso(token, para, titulo, texto);
      setEnviado(personas);
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido enviar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} cerrarLabel="Cerrar">
      {eligiendo && opciones !== null ? (
        <AQuien
          opciones={opciones}
          elegida={para}
          onElegir={(clave) => { setPara(clave); setEligiendo(false); }}
          onVolver={() => setEligiendo(false)}
        />
      ) : enviado > 0 ? (
        // Un aviso no se deshace: en vez de cerrar la hoja sin más, se dice a
        // cuántos ha salido y se cierra a mano.
        <View style={styles.hecho}>
          <View style={styles.hechoIcono}>
            <Ionicons name="checkmark-done" size={26} color={colors.success} />
          </View>
          <Text style={styles.titulo}>Aviso enviado</Text>
          <Text style={styles.coletilla}>
            {enviado === 1 ? 'Le ha llegado a 1 persona.' : `Les ha llegado a ${enviado} personas.`}
          </Text>
          <Boton titulo="Listo" onPress={onClose} style={styles.hechoBoton} />
        </View>
      ) : (
        <>
          <Text style={styles.titulo}>Avisar a tus alumnos</Text>
          <Text style={styles.coletilla}>Les llega como notificación en su app.</Text>

          {fallo ? (
            <View style={styles.error} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorTexto}>{fallo}</Text>
            </View>
          ) : null}

          <Text style={styles.etiqueta}>A QUIÉN</Text>
          {opciones === null ? (
            <ActivityIndicator color={colors.brand} style={styles.cargando} />
          ) : (
            // Una fila que se abre, no una tira de fichas: con ocho clases la
            // tira obliga a deslizar a ciegas para ver si está la que buscas.
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Elegir a quién va el aviso"
              onPress={() => setEligiendo(true)}
              style={({ pressed }) => [styles.desplegable, pressed && { opacity: 0.7 }]}>
              {elegida?.color ? (
                <View style={[styles.punto, { backgroundColor: elegida.color }]} />
              ) : null}
              <Text style={styles.desplegableTexto} numberOfLines={1}>
                {elegida?.nombre ?? 'Todos los alumnos'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.muted} />
            </Pressable>
          )}

          <Text style={styles.etiqueta}>TÍTULO</Text>
          <TextInput
            value={titulo}
            onChangeText={setTitulo}
            placeholder="El jueves es festivo"
            placeholderTextColor={colors.faint}
            style={styles.campo}
            maxLength={120}
            returnKeyType="next"
          />
          {/* Lo que se ve en la notificación sin abrirla: si el título no dice
              qué pasa, el aviso se lee cuando ya da igual. */}
          <Text style={styles.ayuda}>Es lo único que se ve sin abrir la notificación.</Text>

          <Text style={styles.etiqueta}>AVISO</Text>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Cuéntales qué pasa."
            placeholderTextColor={colors.faint}
            style={[styles.campo, styles.campoLargo]}
            maxLength={2000}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.cuenta}>
            <View style={styles.cuentaFila}>
              <Ionicons name="megaphone-outline" size={18} color={colors.brandDark} />
              <Text style={styles.cuentaTexto}>{resumen(cuenta)}</Text>
            </View>
            {/* Quién no se va a enterar, en su propia línea: es la mitad que
                decide si además hay que llamar a alguien. */}
            {cuenta && cuenta.personas > cuenta.con_app ? (
              <View style={styles.cuentaFila}>
                <Ionicons name="call-outline" size={16} color={colors.warning} />
                <Text style={styles.sinApp}>{sinApp(cuenta)}</Text>
              </View>
            ) : null}
            {/* Y el anterior, que es lo que evita mandar dos veces lo mismo o
                encadenar tres avisos en una tarde. */}
            {ultimo ? (
              <View style={styles.cuentaFila}>
                <Ionicons name="time-outline" size={16} color={colors.muted} />
                <Text style={styles.anterior} numberOfLines={2}>
                  El anterior fue {cuando(ultimo.cuando)}: «{ultimo.titulo}»
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.acciones}>
            <Boton
              titulo={enviando ? 'Enviando…' : 'Enviar el aviso'}
              variante={listo && !enviando ? 'principal' : 'secundario'}
              onPress={enviar}
            />
          </View>
        </>
      )}
    </BottomSheet>
  );
}

/** A cuántos llega. El número primero, que es lo que se mira. */
function resumen(cuenta: { personas: number; con_app: number } | null) {
  if (cuenta === null) return 'Contando a cuántos les llega…';
  if (cuenta.personas === 0) return 'No hay nadie a quien avisar aquí.';
  if (cuenta.con_app === 0) return 'No llegará a nadie: ninguno tiene la app.';
  return cuenta.con_app === 1 ? 'Llegará a 1 alumno.' : `Llegará a ${cuenta.con_app} alumnos.`;
}

/** Y a cuántos no, que es lo que convierte el aviso en llamadas. */
function sinApp(cuenta: { personas: number; con_app: number }) {
  const sin = cuenta.personas - cuenta.con_app;
  return sin === 1
    ? 'Otro alumno no tiene la app: a ese hay que llamarle.'
    : `Otros ${sin} no tienen la app: a esos hay que llamarles.`;
}

/** «hoy», «ayer» o «hace 5 días»: lo que hace falta para no repetirse. */
function cuando(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;
  return 'hace más de un mes';
}

/** Elegir a quién va: una lista, con cuánta gente hay detrás de cada opción. */
function AQuien({
  opciones, elegida, onElegir, onVolver,
}: {
  opciones: ParaQuien[];
  elegida: string;
  onElegir: (clave: string) => void;
  onVolver: () => void;
}) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={onVolver}
        style={({ pressed }) => [styles.volver, pressed && { opacity: 0.7 }]}>
        <Ionicons name="chevron-back" size={18} color={colors.brandDark} />
        <Text style={styles.volverTexto}>Volver al aviso</Text>
      </Pressable>

      <Text style={styles.titulo}>A quién va</Text>
      <Text style={styles.coletilla}>Cuenta quien tiene bono, cuota o ha venido hace poco.</Text>

      <ScrollView style={styles.lista} keyboardShouldPersistTaps="handled">
        {opciones.map((opcion) => {
          const puesta = opcion.clave === elegida;
          return (
            <Pressable
              key={opcion.clave}
              accessibilityRole="button"
              accessibilityState={{ selected: puesta }}
              onPress={() => onElegir(opcion.clave)}
              style={({ pressed }) => [styles.fila, pressed && { opacity: 0.7 }]}>
              <View
                style={[
                  styles.puntoGrande,
                  { backgroundColor: opcion.color || colors.brand },
                  !opcion.color && styles.puntoTodos,
                ]}
              />
              <View style={styles.filaTexto}>
                <Text style={styles.filaNombre} numberOfLines={1}>{opcion.nombre}</Text>
                <Text style={styles.filaPista}>
                  {opcion.personas === 0
                    ? 'Nadie todavía'
                    : opcion.personas === 1
                      ? '1 alumno'
                      : `${opcion.personas} alumnos`}
                </Text>
              </View>
              {puesta ? <Ionicons name="checkmark" size={20} color={colors.brand} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

/**
 * Un mensaje a los que vienen a una clase concreta: «hoy en la sala 2».
 *
 * Sin título ni destinatarios que elegir, porque los dos están decididos por el
 * hecho de estar en esta clase. Escribir y enviar.
 */
export function AvisarAClase({
  visible, clase, onClose,
}: {
  visible: boolean;
  clase: ClaseDetalle;
  onClose: () => void;
}) {
  const { token } = useSession();
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState('');
  const [enviado, setEnviado] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setTexto('');
    setFallo('');
    setEnviado(0);
  }, [visible]);

  async function enviar() {
    if (!token || !texto.trim() || enviando) return;
    setEnviando(true);
    setFallo('');
    try {
      const { personas } = await endpoints.avisarAClase(token, clase.id, texto);
      setEnviado(personas);
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido enviar.');
    } finally {
      setEnviando(false);
    }
  }

  const cuantos = clase.apuntados.length;

  return (
    <BottomSheet visible={visible} onClose={onClose} cerrarLabel="Cerrar">
      {enviado > 0 ? (
        <View style={styles.hecho}>
          <View style={styles.hechoIcono}>
            <Ionicons name="checkmark-done" size={26} color={colors.success} />
          </View>
          <Text style={styles.titulo}>Mensaje enviado</Text>
          <Text style={styles.coletilla}>
            {enviado === 1 ? 'Le ha llegado a 1 persona.' : `Les ha llegado a ${enviado} personas.`}
          </Text>
          <Boton titulo="Listo" onPress={onClose} style={styles.hechoBoton} />
        </View>
      ) : (
        <>
          <Text style={styles.titulo}>Avisar a los que vienen</Text>
          <Text style={styles.coletilla}>
            {clase.nombre} · {clase.hora}
            {cuantos > 0 ? ` · ${cuantos === 1 ? '1 persona' : `${cuantos} personas`}` : ''}
          </Text>

          {fallo ? (
            <View style={styles.error} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorTexto}>{fallo}</Text>
            </View>
          ) : null}

          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Hoy damos en la sala 2."
            placeholderTextColor={colors.faint}
            style={[styles.campo, styles.campoLargo, styles.campoSolo]}
            maxLength={2000}
            multiline
            autoFocus
            textAlignVertical="top"
          />

          <View style={styles.acciones}>
            <Boton
              titulo={enviando ? 'Enviando…' : 'Enviar'}
              variante={texto.trim() && !enviando ? 'principal' : 'secundario'}
              onPress={enviar}
            />
          </View>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  coletilla: { fontSize: 14, color: colors.muted, marginTop: 2, lineHeight: 20 },
  etiqueta: {
    fontSize: 12, fontWeight: '800', color: colors.faint,
    letterSpacing: 0.4, marginTop: space.lg, marginBottom: space.xs,
  },
  cargando: { alignSelf: 'flex-start', marginTop: space.sm },
  desplegable: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: space.md, minHeight: 52,
  },
  desplegableTexto: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  punto: { width: 8, height: 8, borderRadius: 4 },
  puntoGrande: { width: 12, height: 12, borderRadius: 6 },
  puntoTodos: { backgroundColor: colors.brand },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: space.sm, alignSelf: 'flex-start' },
  volverTexto: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
  lista: { marginTop: space.md, flexShrink: 1, maxHeight: 400 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  filaTexto: { flex: 1, gap: 2 },
  filaNombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  filaPista: { fontSize: 13, color: colors.muted },
  campo: {
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: space.md, paddingVertical: space.md,
    fontSize: 16, color: colors.text,
  },
  campoLargo: { minHeight: 96 },
  campoSolo: { marginTop: space.lg },
  ayuda: { fontSize: 13, color: colors.faint, marginTop: space.xs, lineHeight: 18 },
  cuenta: {
    gap: space.sm, backgroundColor: colors.brandSoft, borderRadius: radius.md,
    padding: space.md, marginTop: space.lg,
  },
  cuentaFila: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  cuentaTexto: { flex: 1, fontSize: 15, color: colors.brandDark, fontWeight: '700', lineHeight: 20 },
  sinApp: { flex: 1, fontSize: 13, color: colors.warning, fontWeight: '600', lineHeight: 18 },
  anterior: { flex: 1, fontSize: 13, color: colors.muted, lineHeight: 18 },
  acciones: { gap: space.sm, marginTop: space.lg },
  hecho: { alignItems: 'center', gap: space.xs, paddingVertical: space.lg },
  hechoIcono: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.successSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: space.sm,
  },
  hechoBoton: { alignSelf: 'stretch', marginTop: space.lg },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md, marginTop: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger, fontWeight: '600' },
});
