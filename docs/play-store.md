# Ficha de Google Play

Textos y respuestas listos para copiar en Play Console (app «Trackaria Pro»,
paquete `com.trackaria.pro`, cuenta de desarrollador `trackaria.app@gmail.com`).
Si cambias algo en Play Console, cámbialo también aquí para no perderlo.

Lo que se declara aquí tiene que decir lo mismo que en la App Store: las dos
tiendas revisan lo mismo y una contradicción es motivo de rechazo. La ficha de
Apple está en [app-store.md](app-store.md).

**Esta app no es la de los clientes.** La de ellos es «Trackaria» a secas
(`com.trackaria.clases`), con su propia ficha en el repo `trackaria-app`. Las dos
van a salir juntas en el buscador de Play, así que la ficha de cada una tiene que
dejar claro en la primera línea para quién es; si no, un centro se instala la del
alumno y cree que la app está rota.

## Configuración de la tienda

| Campo | Valor |
|---|---|
| Nombre de la aplicación (máx. 30) | `Trackaria Pro` |
| Nombre del paquete | `com.trackaria.pro` |
| Idioma predeterminado | Español (España) – es-ES |
| Aplicación o juego | Aplicación |
| Gratuita o de pago | Gratuita (irreversible) |
| Categoría | Empresa |
| Etiquetas | Gestión de empresas, Agenda y citas, Comunicación de equipos |
| Correo de contacto | soporte@trackaria.com |
| Sitio web | https://www.trackaria.com/ |
| Política de privacidad | https://www.trackaria.com/privacidad/ |
| Países | España |

Las etiquetas se eligen de la lista cerrada de Play; las de arriba son la
intención, el nombre exacto puede variar.

## Descripción breve (máx. 80)

```
La agenda, el WhatsApp y las clases de tu centro, en el móvil.
```

## Descripción completa (máx. 4000)

```
Trackaria Pro es la app del centro, no la de sus clientes. Si tu clínica, tu estudio de pilates o tu centro deportivo lleva la agenda y el WhatsApp con Trackaria, esta es la app para llevarlo desde el móvil cuando no estás delante del ordenador.

(La app de tus clientes, para que reserven sus clases, es «Trackaria» a secas.)

LO QUE ESTÁ PENDIENTE, Y NADA MÁS
• La pantalla de inicio enseña solo dos cosas: quién está pidiendo cita y a quién no ha sabido contestarle el bot.
• Cuando alguien pide hablar con una persona, te suena el móvil. Por cada mensaje de WhatsApp no: esos ya te suenan en tu WhatsApp.

EL WHATSAPP DEL CENTRO
• Las conversaciones del número del centro, diciendo en cada una quién está contestando: el bot o tú.
• Coges tú la conversación con un toque, y se la devuelves al bot cuando terminas.
• Contestas desde la app sin tener que abrir otra cosa.

LA AGENDA DEL DÍA
• Las citas de hoy con su profesional, su tratamiento y de dónde salió cada una.
• Las que están sin confirmar, para confirmarlas de una en una.

LAS CLASES, CON ALGUIEN DELANTE
• Las clases del día con sus plazas libres y quién viene a cada una.
• Apuntar y quitar a alguien en el momento, que es lo que se pregunta en el mostrador.
• Pasar lista: quién vino y quién no, de uno en uno o todos de golpe.
• Cancelar una clase entera: a los apuntados se les devuelve su clase y se les avisa, y la app te dice a quién tienes que llamar porque no tiene la app instalada.
• Dar de alta a quien acaba de entrar por la puerta, con su nombre y su teléfono.
• Venderle un bono y apuntarle sin soltar el móvil.

AVISOS A TUS ALUMNOS
• Un aviso a todos, a los de una clase o a los de un horario concreto: «el martes de las 19:00 cambia de sala».
• Antes de enviarlo te dice a cuánta gente le va a llegar de verdad.
• El historial de lo que ya has mandado, para no repetirte.

SOLO LO QUE USA TU CENTRO
La app enseña únicamente las pestañas que te tocan. Un estudio que solo da clases no ve la agenda de consulta; una clínica sin WhatsApp Business no ve ni chats ni pendientes. Una pestaña siempre vacía hace dudar de si falta algo por configurar.

LO QUE SE QUEDA EN EL ORDENADOR
Los horarios semanales, los profesionales, los precios, los ajustes del bot y la suscripción se cambian en el panel web de Trackaria. Mover eso cambia la semana entera de un centro y quiere una pantalla grande. La app es para lo que no puede esperar.

Para entrar se usa la misma cuenta del panel de Trackaria. La app funciona con los centros que ya usan Trackaria; si quieres usarla en el tuyo, escríbenos a soporte@trackaria.com.

Trackaria no es un producto sanitario y no da consejo médico ni diagnósticos. La app no tiene compras integradas: la suscripción al servicio se gestiona fuera.
```

### Nota sobre nombrar WhatsApp

Se puede decir «WhatsApp» y «WhatsApp Business» en el texto, pero **no** se puede
usar su logo ni su verde en el icono, las capturas o el gráfico destacado, ni
dar a entender que la app es de Meta. Las conversaciones llegan por la API de
WhatsApp Business del servidor: la app **no lee el WhatsApp del teléfono** ni
pide ningún permiso para ello. Conviene decirlo tal cual si Play pregunta.

## Gráficos

| Pieza | Tamaño | Mínimo |
|---|---|---|
| Icono | 512 × 512 PNG, sin transparencia | 1 |
| Gráfico destacado | 1024 × 500 | 1 |
| Capturas de teléfono | 1080 × 1920 (9:16) | 2, mejor 4–8 |

Las capturas van a 1080 × 1920 y no al tamaño del iPhone porque Play no admite
proporciones más alargadas que 9:16.

El icono de 512 ya está hecho: `assets/store/play-icon-512.png`. Sale de
`scripts/iconos.py`, que genera también los del propio proyecto a partir de las
máscaras de `assets/marca/`. Si alguna vez cambia el color de la marca, se
cambia ahí y se vuelve a ejecutar: así no se queda ninguno con el color viejo.

**La identidad de Pro es la contraria que la de la app de clientes**: crema con
la marca en tinta y el acento en oro, frente a tinta con la marca en blanco y el
acento en turquesa. La oscura es la del cliente, la clara es la de trabajo. Eso
es lo que las separa a 48 píxeles en el escritorio de un móvil, que es el único
tamaño al que se decide. No lleva chapa de «PRO»: tres letras en un rectángulo
de ocho píxeles no se leen.


Las piezas las monta `scripts/iconos.py` (el icono) y `scripts/capturas.py`
(todo lo demás). El segundo coge las capturas en crudo del móvil, les pone el
titular encima sobre el crema de la marca y las deja en 1080 × 1920:

```
python3 scripts/capturas.py ~/Desktop/capturas-pro
```

Las capturas en crudo se nombran `01.png`, `02.png`… en el orden de la lista
`TITULARES` del script, y el resultado sale en `~/Desktop/capturas-pro/play/`.
Para rehacer una sola, se sustituye su `NN.png` y se vuelve a ejecutar.

Orden de la ficha (de la tercera no pasa casi nadie, así que las tres primeras
tienen que contar solas para quién es la app y qué resuelve):

1. Pendiente — «Lo que está pendiente, de un vistazo»
2. Un chat con el relevo del bot — «Coge tú la conversación cuando haga falta»
3. Una clase por dentro — «Mira quién viene antes de abrir la sala»
4. El aviso, con el «llegará a N alumnos» — «Avisa a una clase o a un horario»
5. La agenda del día — «Las citas de hoy, sin abrir el ordenador»
6. Las clases de hoy — «El día entero, clase a clase»
7. La ficha de un alumno — «¿Me queda bono?, contestado al momento»

La de Cuenta se quedó fuera a propósito: nadie se instala una app por su
pantalla de ajustes, y es la única que enseña el teléfono del centro.

Los teléfonos que salgan en una captura se tapan antes de publicar, con el
diccionario `TAPADOS` del script: donde el número se lee grande se repinta con
uno limpio, y donde ya estaba medio tapado basta con emborronarlo. Son números
inventados, pero tienen la forma de uno de verdad y la ficha queda publicada
para siempre.

No metas capturas con datos de un centro real. Se sacan del centro de
demostración, que además es el que va a mirar el revisor.

## Contenido de la aplicación

- **Política de privacidad:** https://www.trackaria.com/privacidad/
- **Acceso a la aplicación:** todas o algunas funciones están restringidas.
  - Nombre de las credenciales: `Centro de demostración`
  - Usuario: el correo de la cuenta de demostración del panel
  - Contraseña: la de esa cuenta
  - Instrucciones: escribir correo y contraseña y pulsar «Entrar».
  - **Estas dos cosas se escriben solo en Play Console, nunca en este archivo
    ni en el repositorio.**
- **Anuncios:** no, la app no contiene anuncios.
- **Clasificación de contenido:** categoría «Utilidades, productividad,
  comunicación u otros». Ojo, aquí **no** se responde «No» a todo como en la app
  de clientes: la app permite **comunicarse con otras personas** (el centro
  escribe a sus clientes por WhatsApp), así que eso se responde «Sí». Sale PEGI 3
  igualmente, con el descriptor de interacción entre usuarios. Decir que no y que
  luego lo vean es motivo de retirada.
- **Público objetivo:** de 18 años en adelante. Es una herramienta de trabajo; no
  aplica la política de Familias.
- **Aplicación de noticias:** no.
- **Funciones de datos financieros:** no. La app no cobra ni procesa pagos: los
  bonos se pagan en el centro y la suscripción a Trackaria se gestiona fuera.
- **Publicidad gubernamental / electoral:** no.
- **Comercio (DSA):** sí, comerciante, igual que se declaró a Apple.
- **Salud:** no es un producto sanitario y no da consejo médico. Si el
  cuestionario pregunta por apps de salud, la respuesta es que es una
  herramienta de gestión para el negocio.

## Seguridad de los datos

Mismas respuestas que el App Privacy de Apple. Para cada dato: se **recopila**,
**no se comparte** con terceros, está **cifrado en tránsito** y el usuario
**puede pedir que se borre** escribiendo a soporte@trackaria.com (la cuenta la
da de alta y de baja el propio centro desde el panel, no se borra sola desde la
app).

| Dato | Tipo en Play | Finalidad | Obligatorio |
|---|---|---|---|
| Correo de quien entra | Información personal → Direcciones de correo electrónico | Funciones de la app, gestión de la cuenta | Sí |
| Nombre de quien entra | Información personal → Nombre | Funciones de la app | Sí |
| Identificador de la cuenta | Identificadores → Id. de usuario | Funciones de la app | Sí |
| Token de notificaciones | Identificadores → Id. del dispositivo | Funciones de la app | No |
| Nombre y teléfono de los clientes del centro | Información personal → Nombre, Número de teléfono | Funciones de la app | Sí |
| Conversaciones de WhatsApp del centro | Mensajes → Otros mensajes dentro de la aplicación | Funciones de la app | Sí |
| Citas, reservas, bonos y asistencia | Otros datos | Funciones de la app | Sí |

Las dos últimas filas son la diferencia con la app de clientes y **hay que
declararlas**. Esta app enseña y escribe datos de terceros —los clientes del
centro— y manda mensajes: Play considera eso datos recopilados a través de la
app aunque los teclee el profesional y no el cliente. Declarar de menos es lo
que se castiga; declarar de más, no.

Nada de ubicación, contactos, fotos, salud y fitness, archivos, datos de uso ni
identificadores publicitarios. **Sin publicidad y sin analítica de terceros**,
así que no hay «Compartir» en ninguna fila.

Quién es quién en protección de datos: cada centro es el responsable de los
datos de sus clientes y Trackaria es su encargado del tratamiento. Está escrito
en https://www.trackaria.com/privacidad/.

## Pruebas cerradas

Play exige, para las cuentas personales creadas después del 13/11/2023, una
prueba cerrada con **12 testers que tengan la app instalada 14 días seguidos**
antes de poder publicar en producción. Hacen falta 12 personas reales distintas
con móvil Android y su correo de Google; no valen cuentas propias.

Esa cuenta de 14 días **no empieza hasta que hay una build arriba y los 12
dentro**, así que se sube antes de tener la ficha perfecta: los textos y las
capturas se pueden cambiar durante la prueba, el calendario no.

## Build

`version` en `app.json` tiene que ser `1.0.0` antes de compilar: `0.1.0` es un
número de app sin publicar, y además `runtimeVersion` va por `version`, así que
el número con el que salga a la tienda es el que marca qué móviles se bajan cada
`eas update`.

```
npx eas build --platform android --profile production
npx eas submit --platform android --profile production
```
