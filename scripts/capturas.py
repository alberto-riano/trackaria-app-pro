"""Monta las piezas gráficas de la ficha de Play a partir de capturas del móvil.

Una captura a pelo no vende: quien mira la ficha no sabe qué está viendo. Lo que
se lee es el titular de arriba, y la captura es la prueba. Por eso cada pieza es
un titular grande y la pantalla debajo, con los mismos colores que el icono
—crema, tinta y oro—, para que la ficha y el icono parezcan la misma cosa.

Cómo se usa:

1. Saca las capturas en el móvil, con el centro de demostración y nunca con
   datos de un centro real.
2. Déjalas en `assets/store/capturas/`, nombradas `01.png`, `02.png`… en el
   orden de TITULARES.
3. `python3 scripts/capturas.py`

Deja en esa misma carpeta un `play/` y un `apple/` con todo listo para subir.
Cada tienda pide lo suyo y una pieza no sirve para la otra: Play no admite nada
más alargado que 9:16 y Apple exige el tamaño exacto de un iPhone grande. El
gráfico destacado es solo de Play y se genera siempre.

Las capturas en crudo tienen que venir del iPhone sin pasar por nada que las
comprima —ni WhatsApp ni Telegram—: las de Apple son casi un 50 % más grandes
que las de Play, y una captura pequeña hay que agrandarla y se nota. El script
avisa cuando le pasa.

Las capturas en crudo viven en el repo a propósito: son lo único que no se
puede rehacer solo, porque hacen falta un móvil y un centro con datos. Con
ellas dentro, la ficha entera se reconstruye con una orden aunque pase un año.
Para rehacer una sola, se sustituye su `NN.png` y se vuelve a ejecutar.

Necesita Pillow, que no es dependencia del proyecto: `pip install Pillow` en un
entorno aparte.
"""

import pathlib
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = pathlib.Path(__file__).resolve().parent.parent

CREMA = (244, 239, 227)
TINTA = (12, 31, 49)
ORO = (191, 143, 51)
APAGADO = (122, 125, 118)

NEGRITA = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
NORMAL = '/System/Library/Fonts/Supplemental/Arial.ttf'

# Cada tienda pide lo suyo y no se puede reutilizar una pieza en la otra: Play
# no admite nada más alargado que 9:16, y Apple exige el tamaño exacto de un
# iPhone grande. Son las mismas capturas con otro lienzo.
TIENDAS = {
    'play': (1080, 1920),
    'apple': (1320, 2868),
}

# El tamaño con el que están pensadas las letras y los márgenes. Lo demás se
# escala a partir de aquí, para que una pieza de Apple no salga con el titular
# de un lienzo más estrecho.
BASE = 1080

# El orden importa: en Play casi nadie pasa de la tercera. Las tres primeras
# tienen que contar, por sí solas, para quién es la app y qué resuelve.
TITULARES = [
    ('Lo que está pendiente,\nde un vistazo', 'Quién pide cita y a quién no supo contestar el bot'),
    ('Coge tú la conversación\ncuando haga falta', 'El WhatsApp del centro, con el relevo del bot'),
    ('Mira quién viene\nantes de abrir la sala', 'Y apunta a alguien con él delante'),
    ('Avisa a una clase\no a un horario', 'Y te dice a cuánta gente le va a llegar de verdad'),
    ('Las citas de hoy,\nsin abrir el ordenador', 'Con su profesional y las que faltan por confirmar'),
    ('El día entero,\nclase a clase', 'Lo que está lleno y lo que todavía tiene hueco'),
    ('«¿Me queda bono?»,\ncontestado al momento', 'Sus clases, sus bonos y cuándo vuelve'),
]

# Trozos de cada captura que hay que tapar antes de publicarla.
#
# Los teléfonos del centro de demostración son inventados, pero tienen la forma
# de uno de verdad, y la ficha de Play queda publicada para siempre. Tapar
# cuesta menos que arrepentirse.
#
# Un trozo con `texto` se repinta con ese texto, en la tipografía del sistema y
# del color que tenía: donde el número se lee grande y nítido, un borrón se ve
# a la legua y parece que la app tiene algo que esconder. Un trozo sin `texto`
# se emborrona, que es lo que toca donde ya estaba medio tapado de por sí.
#
# Las medidas son el rectángulo exacto que ocupan las letras, en fracciones del
# ancho y el alto de la captura: así siguen valiendo desde otro móvil.
SISTEMA = '/System/Library/Fonts/SFNS.ttf'

TAPADOS = {
    4: [  # el teléfono que asoma detrás de la hoja del aviso
        {'caja': (0.1900, 0.2880, 0.4790, 0.3125)},
    ],
    7: [  # el teléfono de la ficha del alumno
        {'caja': (0.3636, 0.2615, 0.6800, 0.2755), 'texto': '+34600000000',
         'tinta': (11, 91, 85), 'fondo': (255, 255, 255), 'peso': 'Semibold'},
    ],
}

def fuente(ruta, tamano):
    return ImageFont.truetype(ruta, tamano)


def centrado(dib, texto, fuente_, y, color, ancho, interlineado=1.18):
    """Escribe un texto centrado, línea a línea, y devuelve dónde acaba."""
    for linea in texto.split('\n'):
        caja = dib.textbbox((0, 0), linea, font=fuente_)
        alto = caja[3] - caja[1]
        dib.text(((ancho - (caja[2] - caja[0])) / 2, y - caja[1]), linea, font=fuente_, fill=color)
        y += round(alto * interlineado)
    return y


def ajustada(texto, peso, ancho):
    """La tipografía del sistema al tamaño que hace que el texto mida eso."""
    tamano = 40
    for _ in range(8):
        f = ImageFont.truetype(SISTEMA, tamano)
        f.set_variation_by_name(peso)
        medida = ImageDraw.Draw(Image.new('RGB', (1, 1))).textbbox((0, 0), texto, font=f)
        actual = medida[2] - medida[0]
        if abs(actual - ancho) <= 1:
            break
        tamano = max(6, round(tamano * ancho / actual))
    return f, medida


def tapar(im, trozos):
    """Repinta o emborrona esos trozos de la captura, sin tocar el resto."""
    dib = ImageDraw.Draw(im)
    for trozo in trozos:
        izq, arr, der, aba = trozo['caja']
        caja = (round(izq * im.width), round(arr * im.height),
                round(der * im.width), round(aba * im.height))

        if 'texto' not in trozo:
            recorte = im.crop(caja)
            # El radio va con el alto: lo justo para que no se reconstruya
            # ninguna cifra, y no tanto como para dejar un manchón.
            im.paste(recorte.filter(ImageFilter.GaussianBlur(max(4, recorte.height * 0.45))), caja)
            continue

        # Un margen al borrar, para no dejar los restos del trazo anterior
        # asomando por los lados de lo nuevo.
        margen = round((caja[3] - caja[1]) * 0.35)
        dib.rectangle((caja[0] - margen, caja[1] - margen,
                       caja[2] + margen, caja[3] + margen), fill=trozo['fondo'])
        f, medida = ajustada(trozo['texto'], trozo.get('peso', 'Regular'), caja[2] - caja[0])
        dib.text((caja[0] - medida[0], caja[1] - medida[1]), trozo['texto'], font=f, fill=trozo['tinta'])
    return im


def pantalla(captura, trozos=(), ancho_max=880, alto_max=1430):
    """La captura del móvil, encajada y con la esquina redondeada."""
    im = Image.open(captura).convert('RGB')
    # Se tapa antes de reducir, sobre la imagen grande: así lo repintado se
    # reduce igual que el resto de la captura y no se nota el remiendo.
    if trozos:
        im = tapar(im, trozos)
    factor = min(ancho_max / im.width, alto_max / im.height)
    im = im.resize((round(im.width * factor), round(im.height * factor)), Image.LANCZOS)
    radio = round(im.width * 0.055)
    mascara = Image.new('L', im.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radio, fill=255)
    salida = Image.new('RGBA', im.size, (0, 0, 0, 0))
    salida.paste(im, (0, 0), mascara)
    return salida


def con_sombra(lienzo, im, donde, escala=1.0):
    """Pega la pantalla con una sombra suave: sin ella flota sobre el crema."""
    sombra = Image.new('RGBA', lienzo.size, (0, 0, 0, 0))
    hueco = Image.new('RGBA', im.size, (12, 31, 49, 70))
    hueco.putalpha(im.split()[3].point(lambda v: round(v * 0.28)))
    sombra.paste(hueco, (donde[0], donde[1] + round(18 * escala)), hueco)
    lienzo.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(26 * escala)))
    lienzo.alpha_composite(im.convert('RGBA'), donde)


def pieza(captura, titular, pie, trozos=(), tienda='play'):
    ancho, alto = TIENDAS[tienda]
    escala = ancho / BASE

    lienzo = Image.new('RGBA', (ancho, alto), CREMA + (255,))
    dib = ImageDraw.Draw(lienzo)

    y = centrado(dib, titular, fuente(NEGRITA, round(76 * escala)), round(118 * escala), TINTA, ancho)
    y = centrado(dib, pie, fuente(NORMAL, round(36 * escala)), y + round(22 * escala), APAGADO, ancho)

    # Una raya de oro entre el titular y la pantalla: separa sin meter una caja.
    raya = round(96 * escala)
    dib.rounded_rectangle(
        [(ancho - raya) / 2, y + round(36 * escala), (ancho + raya) / 2, y + round(44 * escala)],
        round(4 * escala), fill=ORO)

    # La pantalla entra entera y no se sale por abajo. Sobresalir queda más
    # moderno, pero lo último de cualquier pantalla de esta app es la barra de
    # pestañas con los globitos, y esos globitos son media venta: son la prueba
    # de que la app te avisa sola de que hay algo esperándote.
    arriba = max(y + round(96 * escala), round(430 * escala))
    im = pantalla(captura, trozos,
                  ancho_max=round(880 * escala), alto_max=alto - arriba - round(56 * escala))
    con_sombra(lienzo, im, ((ancho - im.width) // 2, arriba), escala)
    return lienzo.convert('RGB')


def grafico_destacado():
    """El 1024 × 500 de la cabecera de la ficha. No lleva capturas."""
    lienzo = Image.new('RGBA', (1024, 500), CREMA + (255,))
    dib = ImageDraw.Draw(lienzo)

    icono = Image.open(RAIZ / 'assets' / 'images' / 'icon.png').convert('RGBA')
    lado = 188
    icono = icono.resize((lado, lado), Image.LANCZOS)
    mascara = Image.new('L', (lado, lado), 0)
    ImageDraw.Draw(mascara).rounded_rectangle([0, 0, lado - 1, lado - 1], int(lado * 0.225), fill=255)
    recortado = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    recortado.paste(icono, (0, 0), mascara)
    # Un borde finísimo: el crema del icono sobre el crema del fondo se perdería.
    ImageDraw.Draw(recortado).rounded_rectangle(
        [0, 0, lado - 1, lado - 1], int(lado * 0.225), outline=(214, 206, 188, 255), width=2)
    lienzo.alpha_composite(recortado, (86, 156))

    dib.text((318, 172), 'Trackaria', font=fuente(NEGRITA, 72), fill=TINTA)
    caja = dib.textbbox((318, 172), 'Trackaria', font=fuente(NEGRITA, 72))
    dib.text((caja[2] + 18, 172), 'Pro', font=fuente(NEGRITA, 72), fill=ORO)
    dib.text((320, 268), 'La agenda, el WhatsApp y las clases', font=fuente(NORMAL, 36), fill=APAGADO)
    dib.text((320, 316), 'de tu centro, en el móvil', font=fuente(NORMAL, 36), fill=APAGADO)
    return lienzo.convert('RGB')


def main():
    if len(sys.argv) > 1:
        carpeta = pathlib.Path(sys.argv[1]).expanduser()
    else:
        carpeta = RAIZ / 'assets' / 'store' / 'capturas'

    play = carpeta / 'play'
    play.mkdir(parents=True, exist_ok=True)
    grafico_destacado().save(play / 'grafico-destacado-1024x500.png')
    print(f'{play / "grafico-destacado-1024x500.png"}  1024×500')

    blandas = set()
    hechas = 0
    for tienda, (ancho, alto) in TIENDAS.items():
        salida = carpeta / tienda
        salida.mkdir(parents=True, exist_ok=True)
        for i, (titular, pie) in enumerate(TITULARES, start=1):
            origen = carpeta / f'{i:02d}.png'
            if not origen.exists():
                continue
            destino = salida / f'{i:02d}.png'
            pieza(origen, titular, pie, TAPADOS.get(i, ()), tienda).save(destino)
            print(f'{destino}  {ancho}×{alto}')
            if tienda == 'play':
                hechas += 1
            # Agrandar una captura la deja borrosa, y en la ficha se ve. Las de
            # Apple son casi un 50 % más grandes que las de Play, así que una
            # captura que valía allí puede no valer aquí.
            if Image.open(origen).width < round(880 * ancho / BASE):
                blandas.add(origen.name)

    if hechas == 0:
        print(f'\nNo había capturas en {carpeta}. Déjalas como 01.png, 02.png… y vuelve a ejecutar.')
        return
    if hechas < 4:
        print(f'\nSolo {hechas}. Play pide 2 como mínimo, pero con menos de 4 la ficha no entra '
              f'en algunos sitios donde te puede colocar.')
    if blandas:
        print(f'\nOjo: {", ".join(sorted(blandas))} son más pequeñas de lo que hace falta y se han '
              f'tenido que agrandar. Para la ficha de Apple se notará. Pásalas desde el iPhone sin '
              f'que nada las comprima por el camino.')


if __name__ == '__main__':
    main()
