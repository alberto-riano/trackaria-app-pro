"""Monta las piezas gráficas de la ficha de Play a partir de capturas del móvil.

Una captura a pelo no vende: quien mira la ficha no sabe qué está viendo. Lo que
se lee es el titular de arriba, y la captura es la prueba. Por eso cada pieza es
un titular grande y la pantalla debajo, con los mismos colores que el icono
—crema, tinta y oro—, para que la ficha y el icono parezcan la misma cosa.

Cómo se usa:

1. Saca las capturas en el móvil, con el centro de demostración y nunca con
   datos de un centro real.
2. Déjalas en una carpeta, nombradas `01.png`, `02.png`… en el orden de
   TITULARES.
3. `python3 scripts/capturas.py ~/Desktop/capturas-pro`

Deja en esa misma carpeta un `play/` con todo listo para subir. El gráfico
destacado no necesita capturas y se genera siempre.

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

ANCHO, ALTO = 1080, 1920

# El orden importa: en Play casi nadie pasa de la tercera. Las tres primeras
# tienen que contar, por sí solas, para quién es la app y qué resuelve.
TITULARES = [
    ('Lo que está pendiente,\nde un vistazo', 'Quién pide cita y a quién no supo contestar el bot'),
    ('Coge tú la conversación\ncuando haga falta', 'El WhatsApp del centro, con el relevo del bot'),
    ('Apunta a alguien\ncon él delante', 'Las clases del día y quién viene a cada una'),
    ('Pasa lista\nen dos toques', 'Quién vino y quién no, sin papel'),
    ('Avisa a una clase\no a un horario', 'Y te dice a cuánta gente le va a llegar de verdad'),
    ('Las citas de hoy,\nsin abrir el ordenador', 'Con su profesional y las que faltan por confirmar'),
]


def fuente(ruta, tamano):
    return ImageFont.truetype(ruta, tamano)


def centrado(dib, texto, fuente_, y, color, interlineado=1.18):
    """Escribe un texto centrado, línea a línea, y devuelve dónde acaba."""
    for linea in texto.split('\n'):
        caja = dib.textbbox((0, 0), linea, font=fuente_)
        alto = caja[3] - caja[1]
        dib.text(((ANCHO - (caja[2] - caja[0])) / 2, y - caja[1]), linea, font=fuente_, fill=color)
        y += round(alto * interlineado)
    return y


def pantalla(captura, ancho_max=880, alto_max=1430):
    """La captura del móvil, encajada y con la esquina redondeada."""
    im = Image.open(captura).convert('RGB')
    factor = min(ancho_max / im.width, alto_max / im.height)
    im = im.resize((round(im.width * factor), round(im.height * factor)), Image.LANCZOS)
    radio = round(im.width * 0.055)
    mascara = Image.new('L', im.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radio, fill=255)
    salida = Image.new('RGBA', im.size, (0, 0, 0, 0))
    salida.paste(im, (0, 0), mascara)
    return salida


def con_sombra(lienzo, im, donde):
    """Pega la pantalla con una sombra suave: sin ella flota sobre el crema."""
    sombra = Image.new('RGBA', lienzo.size, (0, 0, 0, 0))
    hueco = Image.new('RGBA', im.size, (12, 31, 49, 70))
    hueco.putalpha(im.split()[3].point(lambda v: round(v * 0.28)))
    sombra.paste(hueco, (donde[0], donde[1] + 18), hueco)
    lienzo.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(26)))
    lienzo.alpha_composite(im.convert('RGBA'), donde)


def pieza(captura, titular, pie):
    lienzo = Image.new('RGBA', (ANCHO, ALTO), CREMA + (255,))
    dib = ImageDraw.Draw(lienzo)

    y = centrado(dib, titular, fuente(NEGRITA, 76), 118, TINTA)
    y = centrado(dib, pie, fuente(NORMAL, 36), y + 22, APAGADO)

    # Una raya de oro entre el titular y la pantalla: separa sin meter una caja.
    dib.rounded_rectangle([(ANCHO - 96) / 2, y + 36, (ANCHO + 96) / 2, y + 44], 4, fill=ORO)

    arriba = max(y + 96, 430)
    im = pantalla(captura, alto_max=ALTO - arriba + 120)
    con_sombra(lienzo, im, ((ANCHO - im.width) // 2, arriba))
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
        carpeta = pathlib.Path.home() / 'Desktop' / 'capturas-pro'
    salida = carpeta / 'play'
    salida.mkdir(parents=True, exist_ok=True)

    grafico_destacado().save(salida / 'grafico-destacado-1024x500.png')
    print(f'{salida / "grafico-destacado-1024x500.png"}  1024×500')

    hechas = 0
    for i, (titular, pie) in enumerate(TITULARES, start=1):
        origen = carpeta / f'{i:02d}.png'
        if not origen.exists():
            continue
        destino = salida / f'{i:02d}.png'
        pieza(origen, titular, pie).save(destino)
        print(f'{destino}  {ANCHO}×{ALTO}')
        hechas += 1

    if hechas == 0:
        print(f'\nNo había capturas en {carpeta}. Déjalas como 01.png, 02.png… y vuelve a ejecutar.')
    elif hechas < 4:
        print(f'\nSolo {hechas}. Play pide 2 como mínimo, pero con menos de 4 la ficha no entra '
              f'en algunos sitios donde te puede colocar.')


if __name__ == '__main__':
    main()
