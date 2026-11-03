"""Genera los iconos de Trackaria Pro a partir de la marca y la paleta.

Por qué esto es un script y no cinco PNG sueltos: la marca no existe en SVG en
ningún sitio, así que hasta ahora cambiar un color era abrir un editor y volver
a exportar cinco archivos a mano, con el riesgo de que uno se quedara con el
color viejo. Aquí la geometría está en dos máscaras (`assets/marca/`) y el color
en cuatro constantes de abajo: cambiar la identidad es editar una línea y
ejecutar esto.

Las máscaras son la silueta recortada del logo, separada en trazo y acento, con
la posición y el tamaño exactos que tenían los iconos originales. No se tocan.

    python3 scripts/iconos.py

Necesita Pillow, que no es dependencia del proyecto —esto no se ejecuta en el
móvil—: `pip install Pillow` en un entorno aparte.
"""

import pathlib

from PIL import Image

RAIZ = pathlib.Path(__file__).resolve().parent.parent
MARCA = RAIZ / 'assets' / 'marca'
IMAGENES = RAIZ / 'assets' / 'images'
TIENDA = RAIZ / 'assets' / 'store'

# ── La identidad ────────────────────────────────────────────────────────────
#
# Crema con la marca en tinta y el acento en oro. La app de clientes es la
# contraria —tinta con la marca en blanco y el acento en turquesa— y eso es
# todo el sistema: la oscura es la del cliente, la clara es la de trabajo.
#
# El reparto claro/oscuro es lo que se distingue en un escritorio a 34 píxeles;
# el acento, a ese tamaño, ya casi no se lee. Por eso el contraste lo lleva el
# fondo y no el detalle.

CREMA = (244, 239, 227)
TINTA = (12, 31, 49)
ORO = (191, 143, 51)

# Lo que ocupa la marca dentro de cada lienzo. Son los dos números que ya tenían
# los iconos buenos: el de iOS va a sangre y el de Android tiene que caber en la
# zona segura, porque el lanzador recorta el icono a un círculo.
PARTE_IOS = 0.613
PARTE_ANDROID = 0.460

LADO = 1024


def mascaras():
    """El trazo y el acento, cada uno como una máscara de 1024 × 1024."""
    return (
        Image.open(MARCA / 'trazo.png').convert('L'),
        Image.open(MARCA / 'acento.png').convert('L'),
    )


def factor_para(trazo, acento, parte):
    """Cuánto hay que agrandar la marca para que ocupe esa parte del lienzo.

    Se mide sobre las dos máscaras juntas y no sobre cada una por su lado: el
    acento es más estrecho que el trazo, y escalar cada pieza por su propio
    ancho las separaría una de otra.
    """
    a, b = trazo.getbbox(), acento.getbbox()
    ancho = max(a[2], b[2]) - min(a[0], b[0])
    return (LADO * parte) / ancho


def escalar(mascara, factor):
    """Agranda una máscara alrededor del centro del lienzo, que es donde va la marca."""
    if abs(factor - 1) < 0.001:
        return mascara
    grande = mascara.resize((round(LADO * factor), round(LADO * factor)), Image.LANCZOS)
    hueco = Image.new('L', (LADO, LADO), 0)
    hueco.paste(grande, ((LADO - grande.width) // 2, (LADO - grande.height) // 2))
    return hueco


def pintar(lienzo, mascara, color):
    lienzo.paste(Image.new('RGBA', lienzo.size, color + (255,)), (0, 0), mascara)


def icono_ios():
    """El icono de iOS: cuadrado y a sangre, que el sistema ya lo redondea."""
    trazo, acento = mascaras()
    factor = factor_para(trazo, acento, PARTE_IOS)
    img = Image.new('RGBA', (LADO, LADO), CREMA + (255,))
    pintar(img, escalar(trazo, factor), TINTA)
    pintar(img, escalar(acento, factor), ORO)
    return img.convert('RGB')


def primer_plano():
    """El primer plano de Android: la marca sola, sobre nada."""
    trazo, acento = mascaras()
    img = Image.new('RGBA', (LADO, LADO), (0, 0, 0, 0))
    pintar(img, trazo, TINTA)
    pintar(img, acento, ORO)
    return img


def monocromo():
    """La silueta para los iconos con tema de Android, que los tiñe el sistema."""
    trazo, acento = mascaras()
    silueta = Image.new('L', (LADO, LADO), 0)
    silueta.paste(trazo, (0, 0), trazo)
    silueta.paste(acento, (0, 0), acento)
    img = Image.new('RGBA', (LADO, LADO), (255, 255, 255, 0))
    img.putalpha(silueta)
    return img


def splash():
    """La marca de la pantalla de arranque, del mismo tamaño que el primer plano."""
    return primer_plano()


def icono_de_la_tienda():
    """El de 512 × 512 de la ficha de Play. Sin transparencia, o lo rechaza."""
    return icono_ios().resize((512, 512), Image.LANCZOS)


def main():
    TIENDA.mkdir(parents=True, exist_ok=True)
    salidas = [
        (IMAGENES / 'icon.png', icono_ios()),
        (IMAGENES / 'android-icon-foreground.png', primer_plano()),
        (IMAGENES / 'android-icon-monochrome.png', monocromo()),
        (IMAGENES / 'splash-icon.png', splash()),
        (TIENDA / 'play-icon-512.png', icono_de_la_tienda()),
    ]
    for ruta, imagen in salidas:
        imagen.save(ruta)
        print(f'{ruta.relative_to(RAIZ)}  {imagen.size[0]}×{imagen.size[1]}  {imagen.mode}')


if __name__ == '__main__':
    main()
