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
# El fondo ilustrado del lienzo, si lo hay. Sin él, el crema liso de siempre.
FONDOS = RAIZ / 'assets' / 'store' / 'fondos' / 'ficha.png'


# El tono único de los dibujos del fondo.
TRAZO = (199, 181, 152)


def un_solo_tono(fondo):
    """Repinta los dibujos en un único color, conservando la fuerza del trazo.

    El fondo viene con piezas que no casan entre sí: unas de línea fina, otras
    rellenas, y algún garabato mucho más oscuro que el resto. Igualar el grosor
    de un dibujo ya rasterizado no se puede, pero el color sí, y es lo que más
    se nota: con un solo tono el conjunto se lee como una familia aunque los
    trazos no midan lo mismo.

    Se mide cuánta tinta hay en cada píxel —lo que se aparta del crema— y se
    usa como transparencia del tono nuevo. Así una línea fina sigue siendo fina
    y un relleno sigue siendo relleno.

    Y además se levantan los trazos flojos. El fondo trae unos dibujos mucho
    más claros que otros —los de arriba casi no se ven—, y copiar la fuerza tal
    cual conserva esa diferencia. La curva sube lo tenue sin tocar lo que ya
    era fuerte, que es lo que los pone a todos en la misma familia.

    El suelo está para que el papel no suba con ellos: el crema del fondo no es
    plano del todo y, sin cortar por abajo, su grano se convertiría en manchas.
    """
    gris = fondo.convert('L')
    claro = max(gris.getextrema()[1], 1)
    tinta = gris.point(lambda v: max(0, min(255, round((claro - v) * 255 / max(1, claro - 60)))))
    suelo, curva = 20, 0.55
    tinta = tinta.point(
        lambda v: 0 if v <= suelo else round(255 * (((v - suelo) / (255 - suelo)) ** curva)))
    papel = Image.new('RGB', fondo.size, CREMA)
    papel.paste(Image.new('RGB', fondo.size, TRAZO), (0, 0), tinta)
    return papel


# Por dónde se recorta el fondo cuando sobra ancho: 0,5 es por el centro y 1
# es pegado a la derecha.
#
# Los dos van centrados. Está aquí porque el lienzo de Apple es bastante más
# estrecho de proporción que el fondo y hay que quitarle ancho, así que si
# algún día entra un dibujo que no aguante el recorte, se mueve desde aquí.
SESGO = {'play': 0.5, 'apple': 0.5}


def lienzo(ancho, alto, tienda='play'):
    """El papel sobre el que va la pieza.

    Con el fondo ilustrado se recorta por el centro y no se deforma: es un
    marco de dibujos alrededor de un hueco, y estirarlo metería los dibujos
    donde va el móvil, que es justo lo que el hueco evita.
    """
    if not FONDOS.exists():
        return Image.new('RGBA', (ancho, alto), CREMA + (255,))
    fondo = Image.open(FONDOS).convert('RGB')
    factor = max(ancho / fondo.width, alto / fondo.height)
    fondo = fondo.resize((round(fondo.width * factor), round(fondo.height * factor)), Image.LANCZOS)
    izquierda = round((fondo.width - ancho) * SESGO.get(tienda, 0.5))
    arriba = (fondo.height - alto) // 2
    # El tono se iguala ya al tamaño final y no antes de agrandar. El fondo
    # viene a 768 de ancho y hay que subirlo a 1080 o a 1320, y agrandar
    # emborrona: la curva aplicada después recupera el filo del trazo en vez de
    # estirar uno que ya venía blando.
    papel = un_solo_tono(fondo.crop(
        (izquierda, arriba, izquierda + ancho, arriba + alto))).convert('RGBA')

    # Un velo de crema por encima. Los dibujos son decoración: a toda potencia
    # compiten con la captura, que es lo único que de verdad hay que mirar.
    papel.alpha_composite(Image.new('RGBA', (ancho, alto), CREMA + (30,)))

    # Y más opaco arriba, donde va el titular. Un titular sobre una campana y
    # un calendario no se lee, por grande que sea.
    velo = Image.new('RGBA', (ancho, alto), CREMA + (0,))
    tapa = round(alto * 0.30)
    tira = Image.new('L', (1, tapa))
    pintor = tira.load()
    for y in range(tapa):
        pintor[0, y] = round(235 * (1 - (y / tapa) ** 1.6))
    velo.putalpha(Image.new('L', (ancho, alto), 0))
    velo.paste(Image.new('RGBA', (ancho, tapa), CREMA + (255,)),
               (0, 0), tira.resize((ancho, tapa), Image.BILINEAR))
    papel.alpha_composite(velo)
    return papel


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
    ('Las citas del día,\nsin abrir el ordenador', 'Quién viene, a qué hora y con quién'),
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


# Dónde cae la isla dinámica dentro de la captura, en fracciones de su tamaño.
#
# La captura de un iPhone trae la barra de estado pero no la isla: el hueco
# entre la hora y la batería sale del color de la app. Dibujarla ahí es
# devolverle lo que el sistema no guarda, no inventarse nada.
ISLA = (0.3576, 0.0143, 0.6424, 0.0527)

# Hasta dónde llega la barra de estado y de dónde se saca con qué taparla.
#
# La hora y la batería del momento en que se disparó la captura no dicen nada
# de la app y ensucian: cada pieza salía con una hora distinta y con la batería
# al 43 %. Se tapan copiando la franja de justo debajo y estirándola hacia
# arriba, en vez de pintar un rectángulo de un color elegido a ojo: así vale
# igual para una pantalla de fondo liso que para una con cabecera de otro
# color, y no queda una costura a media altura.
BARRA = 0.052
MUESTRA = 0.056

# El marco. Todo en fracciones del ancho de la pantalla, menos lo que se dice.
#
# El radio es lo que más hace que se lea como un iPhone: las esquinas de uno de
# verdad son enormes —unos 60 pt sobre 440 de ancho— y con un redondeo pequeño
# el conjunto parece un marco de fotos.
MARCO = 0.050
RADIO = 0.118
CUERPO = (18, 18, 20)      # el negro del bisel
# El canto no es gris plano: es metal, y el metal se ve porque coge más luz en
# los filos que en el medio. Tres paradas de arriba abajo bastan para eso.
RAIL = ((198, 196, 202), (116, 114, 122), (198, 196, 202))
BOTON = (138, 136, 144)

# Los botones, en fracciones del alto del móvil: (lado, desde, hasta).
BOTONES = [
    ('izq', 0.150, 0.192),   # el de acción
    ('izq', 0.228, 0.302),   # subir volumen
    ('izq', 0.318, 0.392),   # bajar volumen
    ('der', 0.238, 0.348),   # encendido
]

# La barrita de inicio. Las capturas no la traen —la dibuja el sistema por
# encima de todo y no entra en el PNG—, y es de las cosas que más dicen
# «iPhone» sin que nadie se pare a mirarla.
INICIO = (0.316, 0.0052, 0.0084)   # ancho, alto y separación del borde


def sin_barra_de_estado(im):
    """Quita la hora y la batería, estirando hacia arriba lo que hay debajo."""
    alto_barra = round(BARRA * im.height)
    origen = round(MUESTRA * im.height)
    franja = im.crop((0, origen, im.width, origen + 4))
    im.paste(franja.resize((im.width, alto_barra), Image.NEAREST), (0, 0))
    return im


def barrita_de_inicio(im):
    ancho = round(INICIO[0] * im.width)
    alto = max(3, round(INICIO[1] * im.height))
    abajo = im.height - round(INICIO[2] * im.height)
    izquierda = (im.width - ancho) // 2
    ImageDraw.Draw(im).rounded_rectangle(
        [izquierda, abajo - alto, izquierda + ancho, abajo], alto // 2, fill=(24, 24, 28))
    return im


def _metal(ancho, alto):
    """Una tira de titanio: clara en los filos y más oscura por el medio."""
    tira = Image.new('RGB', (1, alto))
    pintor = tira.load()
    for y in range(alto):
        parte = y / max(1, alto - 1)
        if parte < 0.5:
            a, b, mezcla = RAIL[0], RAIL[1], parte * 2
        else:
            a, b, mezcla = RAIL[1], RAIL[2], (parte - 0.5) * 2
        pintor[0, y] = tuple(round(a[i] + (b[i] - a[i]) * mezcla) for i in range(3))
    return tira.resize((ancho, alto), Image.BILINEAR).convert('RGBA')


def enmarcar(im):
    """Mete la pantalla en un cuerpo de iPhone, con su canto y sus botones."""
    grosor = max(3, round(im.width * MARCO))
    salto = max(2, round(grosor * 0.26))          # cuánto sobresalen los botones
    ancho, alto = im.width + grosor * 2, im.height + grosor * 2
    radio = round(im.width * RADIO) + grosor

    cuerpo = Image.new('RGBA', (ancho + salto * 2, alto), (0, 0, 0, 0))
    dib = ImageDraw.Draw(cuerpo)

    # Primero los botones, para que el cuerpo se les pose encima y queden
    # saliendo del canto en vez de pegados por fuera.
    for lado, desde, hasta in BOTONES:
        arriba, abajo = round(desde * alto), round(hasta * alto)
        caja = ([0, arriba, salto + grosor, abajo] if lado == 'izq'
                else [ancho + salto - grosor, arriba, ancho + salto * 2 - 1, abajo])
        dib.rounded_rectangle(caja, round(salto * 0.8), fill=BOTON + (255,))

    izquierda = salto
    mascara = Image.new('L', (ancho, alto), 0)
    ImageDraw.Draw(mascara).rounded_rectangle([0, 0, ancho - 1, alto - 1], radio, fill=255)
    cuerpo.paste(_metal(ancho, alto), (izquierda, 0), mascara)

    # El bisel negro por dentro del canto: el canto es una línea de metal, no
    # un marco entero, y eso es justo lo que distingue a un iPhone.
    canto = max(2, round(grosor * 0.26))
    ImageDraw.Draw(cuerpo).rounded_rectangle(
        [izquierda + canto, canto, izquierda + ancho - 1 - canto, alto - 1 - canto],
        radio - canto, fill=CUERPO + (255,))

    cuerpo.alpha_composite(im, (izquierda + grosor, grosor))
    return cuerpo


def pantalla(captura, trozos=(), ancho_max=880, alto_max=1430):
    """La captura del móvil, encajada, con la isla y dentro de su marco."""
    im = Image.open(captura).convert('RGB')
    # Se tapa antes de reducir, sobre la imagen grande: así lo repintado se
    # reduce igual que el resto de la captura y no se nota el remiendo.
    if trozos:
        im = tapar(im, trozos)
    # Antes de reducir, para que todo se suavice igual que el resto.
    im = sin_barra_de_estado(im)
    ImageDraw.Draw(im).rounded_rectangle(
        [round(ISLA[0] * im.width), round(ISLA[1] * im.height),
         round(ISLA[2] * im.width), round(ISLA[3] * im.height)],
        round((ISLA[3] - ISLA[1]) * im.height / 2), fill=(0, 0, 0))

    # El marco ocupa sitio, así que la pantalla entra algo más pequeña para que
    # el conjunto siga cabiendo donde cabía. A lo ancho suma el bisel de los
    # dos lados más lo que sobresalen los botones; a lo alto, solo el bisel.
    # Con un único margen para las dos medidas, el móvil encogía de más.
    de_ancho = ancho_max / (im.width * (1 + 2 * MARCO + 1.1 * MARCO))
    de_alto = alto_max / (im.height + 2 * MARCO * im.width)
    factor = min(de_ancho, de_alto)
    im = im.resize((round(im.width * factor), round(im.height * factor)), Image.LANCZOS)
    radio = round(im.width * RADIO)
    mascara = Image.new('L', im.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radio, fill=255)
    salida = Image.new('RGBA', im.size, (0, 0, 0, 0))
    salida.paste(barrita_de_inicio(im), (0, 0), mascara)
    return enmarcar(salida)


def con_sombra(lienzo, im, donde, escala=1.0):
    """Pega la pantalla con una sombra suave: sin ella flota sobre el crema."""
    sombra = Image.new('RGBA', lienzo.size, (0, 0, 0, 0))
    hueco = Image.new('RGBA', im.size, (12, 31, 49, 70))
    hueco.putalpha(im.split()[3].point(lambda v: round(v * 0.45)))
    sombra.paste(hueco, (donde[0], donde[1] + round(18 * escala)), hueco)
    lienzo.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(26 * escala)))
    lienzo.alpha_composite(im.convert('RGBA'), donde)


def pieza(captura, titular, pie, trozos=(), tienda='play'):
    ancho, alto = TIENDAS[tienda]
    escala = ancho / BASE

    papel = lienzo(ancho, alto, tienda)
    dib = ImageDraw.Draw(papel)

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
                  ancho_max=round(800 * escala), alto_max=alto - arriba - round(120 * escala))
    con_sombra(papel, im, ((ancho - im.width) // 2, arriba), escala)
    return papel.convert('RGB')


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
            pieza(origen, titular, pie, TAPADOS.get(i, ()), tienda).save(destino, optimize=True)
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
