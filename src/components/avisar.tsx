import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { Insignia } from '@/components/clase-ui';
import { BottomSheet } from '@/components/overlay';
import { Boton } from '@/components/ui';
import {
  ApiError, endpoints,
  type AvisoEnviado, type ClaseDetalle, type HorarioDeAviso, type ParaQuien,
} from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

type Paso = 'escribir' | 'aquien' | 'horarios' | 'historial' | 'enviado';

/**
 * Un aviso a los alumnos: «el jueves es festivo».
 *
 * Lo que convierte esto en algo que se hace desde el móvil es cuándo se hace:
 * cuando te enteras de que hay que avisar, que casi nunca es estando sentado en
 * el ordenador del centro.
 *
 * El aviso viaja por la app de alumnos, así que antes de enviarlo se dice a
 * cuántos les va a llegar de verdad: «llegará a 12, otros 6 no tienen la app».
 * Dar por avisado a medio centro es peor que no avisar, porque nadie lo sabe.
 */
export function Avisar({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { token } = useSession();
  const [paso, setPaso] = useState<Paso>('escribir');
  const [opciones, setOpciones] = useState<ParaQuien[] | null>(null);
  const [historial, setHistorial] = useState<AvisoEnviado[]>([]);
  const [para, setPara] = useState('all');
  // Lo elegido con sus palabras. Un horario no está en `opciones`, así que su
  // nombre no se puede buscar ahí: viaja con la elección.
  const [etiqueta, setEtiqueta] = useState<ParaQuien | null>(null);
  const [abierta, setAbierta] = useState<ParaQuien | null>(null);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [cuenta, setCuenta] = useState<{ personas: number; con_app: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState('');
  const [enviado, setEnviado] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setPaso('escribir');
    setPara('all');
    setEtiqueta(null);
    setAbierta(null);
    setTitulo('');
    setTexto('');
    setFallo('');
    setEnviado(0);
  }, [visible]);

  useEffect(() => {
    if (!visible || !token || opciones !== null) return;
    let vigente = true;
    endpoints
      .avisos(token)
      .then(({ opciones: posibles, avisos }) => {
        if (!vigente) return;
        setOpciones(posibles);
        setHistorial(avisos);
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

  const elegida = etiqueta ?? (opciones ?? []).find((opcion) => opcion.clave === para) ?? null;
  const listo = titulo.trim().length > 0 && texto.trim().length > 0 && (cuenta?.personas ?? 0) > 0;

  function elegir(opcion: ParaQuien) {
    setPara(opcion.clave);
    setEtiqueta(opcion);
    setPaso('escribir');
  }

  async function enviar() {
    if (!token || !listo || enviando) return;
    setEnviando(true);
    setFallo('');
    try {
      const { personas, avisos } = await endpoints.enviarAviso(token, para, titulo, texto);
      setEnviado(personas);
      setHistorial(avisos);
      setPaso('enviado');
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido enviar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} cerrarLabel="Cerrar">
      {paso === 'aquien' && opciones !== null ? (
        <AQuien
          opciones={opciones}
          elegida={para}
          onElegir={elegir}
          onAbrir={(opcion) => { setAbierta(opcion); setPaso('horarios'); }}
          onVolver={() => setPaso('escribir')}
        />
      ) : paso === 'horarios' && abierta ? (
        <Horarios
          clase={abierta}
          elegida={para}
          onElegir={elegir}
          onVolver={() => setPaso('aquien')}
        />
      ) : paso === 'historial' ? (
        <Historial avisos={historial} onVolver={() => setPaso('escribir')} />
      ) : paso === 'enviado' ? (
        // Un aviso no se deshace: en vez de cerrar la hoja sin más, se dice a
        // cuántos ha salido y se cierra a mano.
        <View style={styles.hecho}>
          <View style={styles.hechoIcono}>
            <Ionicons name="checkmark-done" size={26} color={colors.success} />
          </View>
          <Text style={styles.titulo}>Aviso enviado</Text>
          <Text style={[styles.coletilla, styles.centrada]}>
            {enviado === 1 ? 'Le ha llegado a 1 alumno.' : `Les ha llegado a ${enviado} alumnos.`}
          </Text>
          <Boton titulo="Listo" onPress={onClose} style={styles.hechoBoton} />
        </View>
      ) : (
        // En un ScrollView para que se pueda arrastrar y quitar el teclado: el
        // campo del aviso es de varias líneas, así que su Intro hace un salto
        // de línea y no cierra nada, y tocar fuera cierra la hoja entera.
        <ScrollView
          style={styles.cuerpo}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <View style={styles.cabecera}>
            <View style={styles.cabeceraTexto}>
              <Text style={styles.titulo}>Avisar a tus alumnos</Text>
              <Text style={styles.coletilla}>Les llega como notificación en su app.</Text>
            </View>
            {/* El historial, por si ya lo mandaste esta mañana. */}
            {historial.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver los avisos enviados"
                onPress={() => setPaso('historial')}
                style={({ pressed }) => [styles.reloj, pressed && { opacity: 0.7 }]}>
                <Ionicons name="time-outline" size={20} color={colors.brandDark} />
              </Pressable>
            ) : null}
          </View>

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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Elegir a quién va el aviso"
              onPress={() => setPaso('aquien')}
              style={({ pressed }) => [styles.desplegable, pressed && { opacity: 0.7 }]}>
              <Insignia
                nombre={elegida?.nombre ?? 'Todos'}
                color={elegida?.color ?? colors.brand}
                imagen={elegida?.imagen}
                tamano={40}
              />
              <View style={styles.desplegableTexto}>
                <Text style={styles.desplegableNombre} numberOfLines={1}>
                  {elegida?.nombre ?? 'Todos los alumnos'}
                </Text>
                {elegida?.detalle ? (
                  <Text style={styles.desplegablePie} numberOfLines={1}>{elegida.detalle}</Text>
                ) : null}
              </View>
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
          </View>

          <View style={styles.acciones}>
            <Boton
              titulo={enviando ? 'Enviando…' : 'Enviar el aviso'}
              variante={listo && !enviando ? 'principal' : 'secundario'}
              onPress={enviar}
            />
          </View>
        </ScrollView>
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

/** «hoy», «ayer» o «hace 5 días». */
function cuando(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;
  if (dias < 60) return 'hace un mes';
  return `hace ${Math.floor(dias / 30)} meses`;
}

function Volver({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.volver, pressed && { opacity: 0.7 }]}>
      <Ionicons name="chevron-back" size={18} color={colors.brandDark} />
      <Text style={styles.volverTexto}>{texto}</Text>
    </Pressable>
  );
}

/**
 * A quién va: todos, o una clase.
 *
 * Con la foto de cada clase delante se elige con la vista y no leyendo, que es
 * lo que se hace de verdad cuando ya te sabes tus clases de memoria.
 *
 * Una clase con varios horarios lleva flecha: dentro están «los del martes a
 * las 19:00». Con uno solo no, porque afinar sería elegir lo mismo otra vez.
 */
function AQuien({
  opciones, elegida, onElegir, onAbrir, onVolver,
}: {
  opciones: ParaQuien[];
  elegida: string;
  onElegir: (opcion: ParaQuien) => void;
  onAbrir: (opcion: ParaQuien) => void;
  onVolver: () => void;
}) {
  return (
    <>
      <Volver texto="Volver al aviso" onPress={onVolver} />
      <Text style={styles.titulo}>A quién va</Text>
      <Text style={styles.coletilla}>Cuenta quien tiene bono, cuota o ha venido hace poco.</Text>

      <ScrollView style={styles.lista} keyboardShouldPersistTaps="handled">
        {opciones.map((opcion) => {
          const puesta = opcion.clave === elegida;
          const afinable = opcion.horarios > 1;
          return (
            <Pressable
              key={opcion.clave}
              accessibilityRole="button"
              accessibilityState={{ selected: puesta }}
              accessibilityLabel={
                afinable ? `${opcion.nombre}, ver sus horarios` : opcion.nombre
              }
              onPress={() => (afinable ? onAbrir(opcion) : onElegir(opcion))}
              style={({ pressed }) => [styles.fila, pressed && { opacity: 0.7 }]}>
              <Insignia
                nombre={opcion.nombre}
                color={opcion.color || colors.brand}
                imagen={opcion.imagen}
                tamano={44}
              />
              <View style={styles.filaTexto}>
                <Text style={styles.filaNombre} numberOfLines={1}>{opcion.nombre}</Text>
                <Text style={styles.filaPista} numberOfLines={1}>
                  {cuantos(opcion.personas)}
                  {afinable ? `  ·  ${opcion.horarios} horarios` : ''}
                </Text>
              </View>
              {puesta ? (
                <Ionicons name="checkmark" size={20} color={colors.brand} />
              ) : afinable ? (
                <Ionicons name="chevron-forward" size={18} color={colors.faint} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

/** Los horarios de una clase: «los del martes a las 19:00». */
function Horarios({
  clase, elegida, onElegir, onVolver,
}: {
  clase: ParaQuien;
  elegida: string;
  onElegir: (opcion: ParaQuien) => void;
  onVolver: () => void;
}) {
  const { token } = useSession();
  const [horarios, setHorarios] = useState<HorarioDeAviso[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    const id = clase.clave.replace('tipo:', '');
    endpoints
      .horariosDeAviso(token, id)
      .then(({ horarios: encontrados }) => { if (vigente) setHorarios(encontrados); })
      .catch(() => { if (vigente) setHorarios([]); });
    return () => { vigente = false; };
  }, [token, clase.clave]);

  return (
    <>
      <Volver texto="Todas las clases" onPress={onVolver} />
      <View style={styles.cabeceraClase}>
        <Insignia nombre={clase.nombre} color={clase.color} imagen={clase.imagen} tamano={40} />
        <View style={styles.cabeceraTexto}>
          <Text style={styles.titulo}>{clase.nombre}</Text>
          <Text style={styles.coletilla}>Todos sus alumnos, o solo los de un horario.</Text>
        </View>
      </View>

      {horarios === null ? (
        <ActivityIndicator color={colors.brand} style={styles.cargando} />
      ) : (
        <ScrollView style={styles.lista} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: clase.clave === elegida }}
            onPress={() => onElegir(clase)}
            style={({ pressed }) => [styles.fila, pressed && { opacity: 0.7 }]}>
            <View style={styles.iconoHorario}>
              <Ionicons name="people-outline" size={20} color={colors.brandDark} />
            </View>
            <View style={styles.filaTexto}>
              <Text style={styles.filaNombre}>Todos los de {clase.nombre}</Text>
              <Text style={styles.filaPista}>{cuantos(clase.personas)}</Text>
            </View>
            {clase.clave === elegida ? (
              <Ionicons name="checkmark" size={20} color={colors.brand} />
            ) : null}
          </Pressable>

          {horarios.map((horario) => (
            <Pressable
              key={horario.clave}
              accessibilityRole="button"
              accessibilityState={{ selected: horario.clave === elegida }}
              onPress={() =>
                onElegir({
                  clave: horario.clave,
                  nombre: `${clase.nombre} · ${horario.nombre}`,
                  detalle: horario.detalle,
                  color: clase.color,
                  imagen: clase.imagen,
                  horarios: 0,
                  personas: horario.personas,
                })
              }
              style={({ pressed }) => [styles.fila, pressed && { opacity: 0.7 }]}>
              <View style={styles.iconoHorario}>
                <Ionicons name="time-outline" size={20} color={colors.brandDark} />
              </View>
              <View style={styles.filaTexto}>
                <Text style={styles.filaNombre} numberOfLines={1}>{horario.nombre}</Text>
                <Text style={styles.filaPista} numberOfLines={1}>
                  {cuantos(horario.personas)}
                  {horario.detalle ? `  ·  ${horario.detalle}` : ''}
                </Text>
              </View>
              {horario.clave === elegida ? (
                <Ionicons name="checkmark" size={20} color={colors.brand} />
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </>
  );
}

function cuantos(personas: number) {
  if (personas === 0) return 'Nadie todavía';
  return personas === 1 ? '1 alumno' : `${personas} alumnos`;
}

/** Lo que ya mandaste, para no repetirte ni encadenar tres en una tarde. */
function Historial({ avisos, onVolver }: { avisos: AvisoEnviado[]; onVolver: () => void }) {
  return (
    <>
      <Volver texto="Volver al aviso" onPress={onVolver} />
      <Text style={styles.titulo}>Avisos enviados</Text>
      <Text style={styles.coletilla}>Lo que ya les has mandado, de lo más reciente a lo más viejo.</Text>

      <ScrollView style={styles.lista} keyboardShouldPersistTaps="handled">
        {avisos.map((aviso) => (
          <View key={aviso.id} style={styles.enviado}>
            <View style={styles.enviadoCabecera}>
              <Text style={styles.enviadoTitulo} numberOfLines={1}>{aviso.titulo}</Text>
              <Text style={styles.enviadoCuando}>{cuando(aviso.cuando)}</Text>
            </View>
            <Text style={styles.enviadoTexto} numberOfLines={3}>{aviso.texto}</Text>
            <Text style={styles.enviadoPie} numberOfLines={1}>
              {aviso.para}  ·  {aviso.personas === 1 ? '1 alumno' : `${aviso.personas} alumnos`}
            </Text>
          </View>
        ))}
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

  const cuantas = clase.apuntados.length;

  return (
    <BottomSheet visible={visible} onClose={onClose} cerrarLabel="Cerrar">
      {enviado > 0 ? (
        <View style={styles.hecho}>
          <View style={styles.hechoIcono}>
            <Ionicons name="checkmark-done" size={26} color={colors.success} />
          </View>
          <Text style={styles.titulo}>Mensaje enviado</Text>
          <Text style={[styles.coletilla, styles.centrada]}>
            {enviado === 1 ? 'Le ha llegado a 1 alumno.' : `Les ha llegado a ${enviado} alumnos.`}
          </Text>
          <Boton titulo="Listo" onPress={onClose} style={styles.hechoBoton} />
        </View>
      ) : (
        <ScrollView
          style={styles.cuerpo}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.titulo}>Avisar a los que vienen</Text>
          <Text style={styles.coletilla}>
            {clase.nombre} · {clase.hora}
            {cuantas > 0 ? ` · ${cuantas === 1 ? '1 persona' : `${cuantas} personas`}` : ''}
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
        </ScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  cuerpo: { flexShrink: 1 },
  cabecera: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  cabeceraTexto: { flex: 1 },
  cabeceraClase: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  reloj: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  titulo: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  coletilla: { fontSize: 14, color: colors.muted, marginTop: 2, lineHeight: 20 },
  centrada: { textAlign: 'center' },
  etiqueta: {
    fontSize: 12, fontWeight: '800', color: colors.faint,
    letterSpacing: 0.4, marginTop: space.lg, marginBottom: space.xs,
  },
  cargando: { alignSelf: 'flex-start', marginTop: space.sm },
  desplegable: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: space.md, paddingVertical: space.sm, minHeight: 60,
  },
  desplegableTexto: { flex: 1, gap: 2 },
  desplegableNombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  desplegablePie: { fontSize: 13, color: colors.muted },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: space.sm, alignSelf: 'flex-start' },
  volverTexto: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
  lista: { marginTop: space.md, flexShrink: 1, maxHeight: 420 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm + 2 },
  filaTexto: { flex: 1, gap: 2 },
  filaNombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  filaPista: { fontSize: 13, color: colors.muted },
  iconoHorario: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  enviado: {
    gap: 3, paddingVertical: space.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  enviadoCabecera: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  enviadoTitulo: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  enviadoCuando: { fontSize: 13, color: colors.faint, fontWeight: '600' },
  enviadoTexto: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  enviadoPie: { fontSize: 13, color: colors.faint, marginTop: 2 },
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
  acciones: { gap: space.sm, marginTop: space.lg, marginBottom: space.sm },
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
