/**
 * El formato de WhatsApp dentro de un mensaje.
 *
 * Lo que llega del canal es texto plano con las marcas de WhatsApp puestas:
 * `*negrita*`, `_cursiva_`, `~tachado~` y ```monoespaciado```. WhatsApp las
 * pinta y se las come, así que el paciente lee una fecha en negrita. Aquí no
 * las interpretaba nadie, y donde él leía un jueves destacado tú leías
 * «*Jueves, 5 de noviembre*». No es de un mensaje suelto: le pasa a todos.
 *
 * Las reglas de abrir y cerrar son las de WhatsApp, y están para que no se
 * invente formato donde no lo hay: la marca tiene que ir pegada a la palabra
 * y empezar fuera de una, así que `2*3*4` son multiplicaciones y un asterisco
 * suelto se queda como está.
 */

export type Estilo = 'negrita' | 'cursiva' | 'tachado' | 'mono';

export type Trozo = { texto: string; estilos: Estilo[] };

// El monoespaciado va primero: sus tres acentos empiezan por uno solo, y
// probando antes el de uno se quedaría con el primero y rompería el resto.
const MARCAS: { signo: string; estilo: Estilo }[] = [
  { signo: '```', estilo: 'mono' },
  { signo: '*', estilo: 'negrita' },
  { signo: '_', estilo: 'cursiva' },
  { signo: '~', estilo: 'tachado' },
];

const LETRA = /[0-9A-Za-zÀ-ÿ]/;
const BLANCO = /\s/;

function abre(texto: string, donde: number, signo: string) {
  if (!texto.startsWith(signo, donde)) return false;
  const antes = texto[donde - 1];
  if (antes !== undefined && LETRA.test(antes)) return false;
  const despues = texto[donde + signo.length];
  // Nada detrás, un espacio detrás o la marca repetida no abren nada.
  if (despues === undefined || BLANCO.test(despues)) return false;
  return !texto.startsWith(signo, donde + signo.length);
}

function cierre(texto: string, desde: number, signo: string) {
  for (let donde = texto.indexOf(signo, desde); donde >= 0; donde = texto.indexOf(signo, donde + 1)) {
    const antes = texto[donde - 1];
    const despues = texto[donde + signo.length];
    if (antes === undefined || BLANCO.test(antes)) continue;
    if (despues === undefined || !LETRA.test(despues)) return donde;
  }
  return -1;
}

function trocear(texto: string, estilos: Estilo[]): Trozo[] {
  const trozos: Trozo[] = [];
  let plano = '';
  const soltar = () => {
    if (plano) trozos.push({ texto: plano, estilos });
    plano = '';
  };

  let donde = 0;
  while (donde < texto.length) {
    const marca = MARCAS.find((candidata) => abre(texto, donde, candidata.signo));
    const fin = marca ? cierre(texto, donde + marca.signo.length, marca.signo) : -1;
    if (!marca || fin < 0) {
      // Una marca sin pareja es un carácter más: así un asterisco suelto se
      // lee igual que lo escribieron.
      plano += texto[donde];
      donde += 1;
      continue;
    }
    soltar();
    const dentro = texto.slice(donde + marca.signo.length, fin);
    const nuevos = estilos.includes(marca.estilo) ? estilos : [...estilos, marca.estilo];
    // Dentro del monoespaciado no se busca más formato: es texto literal.
    trozos.push(...(marca.estilo === 'mono' ? [{ texto: dentro, estilos: nuevos }] : trocear(dentro, nuevos)));
    donde = fin + marca.signo.length;
  }
  soltar();
  return trozos;
}

/** El mensaje partido en trozos, cada uno con los estilos que le tocan. */
export function conMarcas(texto: string): Trozo[] {
  return trocear(texto ?? '', []);
}

/**
 * El mismo texto sin las marcas.
 *
 * Para las líneas de resumen —el último mensaje de la lista de chats, la cita
 * de lo que alguien ha escrito en Pendiente—, donde no cabe el formato pero
 * los asteriscos cantan igual.
 */
export function sinMarcas(texto: string) {
  return conMarcas(texto).map((trozo) => trozo.texto).join('');
}
