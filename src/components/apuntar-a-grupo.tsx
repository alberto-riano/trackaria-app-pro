import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';

import { Insignia } from '@/components/clase-ui';
import { BottomSheet } from '@/components/overlay';
import { Boton } from '@/components/ui';
import { ApiError, endpoints, type Alumno, type Grupo } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

/**
 * Hacer de alguien alumno fijo de uno o varios grupos.
 *
 * La otra forma de pagar que tiene un centro. Un bono son clases sueltas que
 * se gastan; una mensualidad es tener tu plaza en «el de los martes a las
 * siete» todas las semanas, sin gastar nada. Hay centros que llevan solo una
 * de las dos, y otros las dos a la vez.
 *
 * Los grupos salen planos y por día, no agrupados por clase: en el mostrador
 * se dice «el de los martes a las siete», que es un día y una hora, y no
 * «Pilates reformer, y de sus tres horarios, el segundo».
 *
 * Empieza hoy y sin fecha de fin, que es lo que se hace de pie. Un curso de
 * septiembre a junio tiene dos fechas que mirar a la vez y eso es del panel.
 */
export function ApuntarAGrupo({
  visible, alumno, onClose, onApuntado,
}: {
  visible: boolean;
  alumno: Alumno;
  onClose: () => void;
  onApuntado: (alumno: Alumno, reservadas: number, llenas: number) => void;
}) {
  const { token } = useSession();
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState('');

  useEffect(() => {
    if (!visible) return;
    setElegidos([]);
    setFallo('');
  }, [visible]);

  // Los grupos se piden al abrir y no antes: esta hoja es la única que los usa.
  useEffect(() => {
    if (!visible || !token || grupos !== null) return;
    let vigente = true;
    endpoints
      .grupos(token)
      .then(({ grupos: encontrados }) => { if (vigente) setGrupos(encontrados); })
      .catch(() => { if (vigente) setGrupos([]); });
    return () => { vigente = false; };
  }, [visible, token, grupos]);

  function alternar(id: string) {
    setElegidos(elegidos.includes(id) ? elegidos.filter((uno) => uno !== id) : [...elegidos, id]);
  }

  async function apuntar() {
    if (!token || elegidos.length === 0 || guardando) return;
    setGuardando(true);
    setFallo('');
    try {
      const { alumno: actualizado, reservadas, llenas } =
        await endpoints.apuntarAGrupos(token, alumno.id, elegidos);
      onApuntado(actualizado, reservadas, llenas);
      onClose();
    } catch (problema) {
      setFallo(problema instanceof ApiError ? problema.message : 'No se ha podido apuntar.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} cerrarLabel="Cerrar">
      <ScrollView style={styles.cuerpo} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Alumno fijo</Text>
        <Text style={styles.coletilla}>
          Tendrá su plaza todas las semanas, sin gastar bono. Elige a qué grupos.
        </Text>

        {fallo ? (
          <View style={styles.error} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorTexto}>{fallo}</Text>
          </View>
        ) : null}

        {grupos === null ? (
          <ActivityIndicator color={colors.brand} style={styles.cargando} />
        ) : grupos.length === 0 ? (
          <Text style={styles.vacio}>
            Todavía no hay horarios fijos. Se ponen en el panel de Trackaria.
          </Text>
        ) : (
          <View style={styles.lista}>
            {grupos.map((grupo) => {
              const puesto = elegidos.includes(grupo.id);
              return (
                <Pressable
                  key={grupo.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: puesto }}
                  accessibilityLabel={`${grupo.nombre}, ${grupo.dia} a las ${grupo.hora}`}
                  onPress={() => alternar(grupo.id)}
                  style={({ pressed }) => [
                    styles.grupo,
                    puesto && styles.grupoPuesto,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Insignia
                    nombre={grupo.nombre}
                    color={grupo.color}
                    imagen={grupo.imagen}
                    tamano={36}
                  />
                  <View style={styles.grupoTexto}>
                    <Text style={styles.grupoCuando} numberOfLines={1}>
                      {grupo.dia} · {grupo.hora}
                    </Text>
                    <Text style={styles.grupoNombre} numberOfLines={1}>{grupo.nombre}</Text>
                    {grupo.sala || grupo.instructor ? (
                      <Text style={styles.grupoPie} numberOfLines={1}>
                        {[grupo.instructor, grupo.sala].filter(Boolean).join('  ·  ')}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name={puesto ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={puesto ? colors.brand : colors.border}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.acciones}>
          <Boton
            titulo={guardando ? 'Apuntando…' : elegidos.length > 1
              ? `Apuntarle a ${elegidos.length} grupos`
              : 'Apuntarle'}
            variante={elegidos.length > 0 && !guardando ? 'principal' : 'secundario'}
            onPress={apuntar}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  cuerpo: { flexShrink: 1 },
  titulo: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  coletilla: { fontSize: 14, color: colors.muted, marginTop: 2, lineHeight: 20 },
  cargando: { marginVertical: space.xl },
  vacio: { fontSize: 14, color: colors.faint, fontStyle: 'italic', marginTop: space.lg },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md,
    backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md,
  },
  errorTexto: { flex: 1, fontSize: 14, color: colors.danger },
  lista: { marginTop: space.lg, gap: space.sm },
  grupo: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    padding: space.md, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  grupoPuesto: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  grupoTexto: { flex: 1, minWidth: 0, gap: 1 },
  // El día y la hora mandan sobre el nombre: es lo que se dice en voz alta.
  grupoCuando: { fontSize: 15, fontWeight: '800', color: colors.text },
  grupoNombre: { fontSize: 14, color: colors.muted },
  grupoPie: { fontSize: 12, color: colors.faint },
  acciones: { marginTop: space.lg },
});
