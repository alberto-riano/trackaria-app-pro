# Ficha de la App Store

Textos listos para copiar en App Store Connect (app «Trackaria Pro»,
id 6821286278). Si cambias algo en App Store Connect, cámbialo también aquí para
no perderlo.

Tiene que decir lo mismo que la ficha de Play ([play-store.md](play-store.md)):
las dos tiendas revisan lo mismo y una contradicción es motivo de rechazo.

## Información de la app

| Campo | Valor |
|---|---|
| Nombre (máx. 30) | `Trackaria Pro` |
| Subtítulo (máx. 30) | `Tu centro, en el móvil` |
| Idioma principal | Español (España) |
| Categoría principal | Empresa |
| Categoría secundaria | Productividad |
| Derechos de contenido | No contiene contenido de terceros |
| Clasificación por edad | 4+ (confirmado en noviembre de 2026) |
| Precio | Gratis |
| Disponibilidad | España |
| URL de soporte | https://www.trackaria.com/app/ |
| URL de marketing | https://www.trackaria.com/ |
| URL de la política de privacidad | https://www.trackaria.com/privacidad/ |
| Copyright | `2026 Alberto Riaño González` |

El cuestionario de edad de Apple son siete pasos. En el primero, «Prestaciones»,
va todo que **no** —controles parentales, verificación de edad, acceso web no
restringido, contenido generado por los usuarios, redes sociales y publicidad—
menos **«Mensajería y chat», que va que sí**. La app deja escribir a una persona
de verdad desde dentro, y las notas de revisión le piden al revisor que abra un
chat: declarar que no hay mensajería y enseñarle una pantalla de chat es un
rechazo por declaración incompleta. Con esa respuesta la clasificación calculada
sigue siendo **4+**, así que no cuesta nada.

Los pasos 2 a 7 son el cuestionario de contenido y van todos a «Ninguno». En el
último, «Categorías de edades y reemplazo manual», se deja **«No aplicable»**:
«Apta para menores» es el programa Made for Kids y no tiene nada que ver.

Aquí la comunicación es entre un negocio y sus propios clientes por el WhatsApp
del centro, no entre desconocidos: no hay perfiles, ni búsqueda de gente, ni
contenido público. Se responde eso si preguntan.

## Texto promocional (máx. 170, se puede cambiar sin nueva versión)

```
Lo que está pendiente en tu centro, en una pantalla: quién pide cita, a quién no ha sabido contestar el bot y quién viene hoy a clase.
```

## Descripción

```
Trackaria Pro es la app del centro, no la de sus clientes. Si tu clínica, tu estudio de pilates o tu centro deportivo lleva la agenda y el WhatsApp con Trackaria, esta es la app para llevarlo desde el móvil cuando no estás delante del ordenador.

(La app de tus clientes, para que reserven sus clases, es «Trackaria» a secas.)

LO QUE ESTÁ PENDIENTE, Y NADA MÁS
• La pantalla de inicio enseña solo dos cosas: quién está pidiendo cita y a quién no ha sabido contestarle el bot.
• Cuando alguien pide hablar con una persona, te suena el móvil. Por cada mensaje de WhatsApp no: esos ya te suenan en tu WhatsApp.

EL WHATSAPP DEL CENTRO
• Las conversaciones del número del centro, diciendo en cada una quién está contestando: el bot o tú.
• Coges tú la conversación con un toque, y se la devuelves al bot cuando terminas.

LA AGENDA DEL DÍA
• Las citas de hoy con su profesional, su tratamiento y de dónde salió cada una.
• Las que están sin confirmar, para confirmarlas de una en una.

LAS CLASES, CON ALGUIEN DELANTE
• Las clases del día con sus plazas libres y quién viene a cada una.
• Apuntar y quitar a alguien en el momento, que es lo que se pregunta en el mostrador.
• Pasar lista: quién vino y quién no, de uno en uno o todos de golpe.
• Cancelar una clase entera: a los apuntados se les devuelve su clase y se les avisa, y la app te dice a quién tienes que llamar porque no tiene la app instalada.
• Dar de alta a quien acaba de entrar por la puerta, venderle un bono y apuntarle sin soltar el móvil.

AVISOS A TUS ALUMNOS
• Un aviso a todos, a los de una clase o a los de un horario concreto.
• Antes de enviarlo te dice a cuánta gente le va a llegar de verdad.

SOLO LO QUE USA TU CENTRO
La app enseña únicamente las pestañas que te tocan. Un estudio que solo da clases no ve la agenda de consulta; una clínica sin WhatsApp Business no ve ni chats ni pendientes.

LO QUE SE QUEDA EN EL ORDENADOR
Los horarios semanales, los profesionales, los precios, los ajustes del bot y la suscripción se cambian en el panel web de Trackaria. La app es para lo que no puede esperar.

Para entrar se usa la misma cuenta del panel de Trackaria. Trackaria no es un producto sanitario y no da consejo médico ni diagnósticos. La app no tiene compras integradas.
```

## Palabras clave (máx. 100, sin espacios)

```
agenda,citas,clases,pilates,fisioterapia,estudio,recepcion,negocio,whatsapp,reservas,gestion,centro
```

## Información para la revisión de Apple

- **Se requiere inicio de sesión:** sí.
- **Usuario y contraseña:** los de la cuenta del centro de demostración. **Se
  escriben solo en App Store Connect, nunca en este archivo ni en el
  repositorio.**
- **Contacto:** Alberto Riaño González · email · teléfono.
- **Notas** (en inglés, que es lo que leen los revisores):

```
Trackaria Pro is the staff app for physiotherapy clinics, pilates/yoga studios and sports centres in Spain that run their appointments, their WhatsApp Business number and their group classes with Trackaria. It is the counterpart of our client app "Trackaria" (com.trackaria.clases): clients book classes there, the centre runs its day here.

Sign in with the demo centre credentials provided in the sign-in information. The demo centre has appointments, WhatsApp conversations and classes already loaded, so every screen has real-looking content.

Things to try: "Pendiente" (people asking for an appointment and conversations where the bot handed over), open a chat and take it over from the bot, "Agenda" (today's appointments, confirm one), "Clases" (open a class, add or remove someone, take attendance, cancel the class), "Alumnos" (open a student, give them a class pack), and the announcement screen (send a notice to everyone, to one class or to one weekly time slot).

PURPOSE AND AUDIENCE: staff of health and fitness centres in Spain that are already Trackaria customers. It is free, public in the Spanish App Store and works for any centre that uses Trackaria; it is not limited to the staff of one single company.

NO IN-APP PURCHASES: the app sells nothing. Class packs are paid at the centre in person, and the centre's own Trackaria subscription is agreed and billed outside the app. The app contains no purchase flow, no price list and no link to any purchase page.

WHATSAPP: conversations are received and sent through the official WhatsApp Business Platform (Cloud API) on our server. The app does not read the phone's WhatsApp, requests no permission related to it, and uses no WhatsApp branding.

EXTERNAL SERVICES: our own Django backend hosted on AWS in the EU (Spain); Expo (over-the-air updates and push notifications delivered through Apple APNs); WhatsApp Business Platform (Meta) for the centre's conversations. No payment processor, no ads, no analytics or tracking SDKs, no third-party authentication.

REGIONAL DIFFERENCES: none. Offered only in Spain, in Spanish, with the same features for everyone.

REGULATED INDUSTRY: not a medical device; no medical advice, diagnosis or health measurements. Each centre is the data controller of its clients' data and Trackaria is its processor. Privacy policy: https://www.trackaria.com/privacidad/ · Support: https://www.trackaria.com/app/.

ACCOUNTS: accounts belong to the centre and are created and removed by the centre from the Trackaria web panel, so the app has no sign-up and no self-service deletion; a user can ask for removal at soporte@trackaria.com. There is no consumer sign-up flow because the app is only useful to a centre that already has a Trackaria account, which is why demo credentials are provided.
```

El centro de demostración tiene que estar **lleno**: citas de esta semana,
conversaciones con mensajes, clases con gente apuntada y algún bono. Un centro
vacío parece una app a medio hacer, y eso es exactamente lo que le costó a la app
de clientes un rechazo por 2.1.0 App Completeness. Grabar además un vídeo del
recorrido completo en un iPhone real y adjuntarlo desde el primer envío.

## Vídeo para la revisión

`assets/store/trackaria-pro-demo.mp4` — 1:27, sin sonido, 660 × 1434, H.264.

Se sube en *Información de revisión de la app* → **Archivos adjuntos**, en la
misma pantalla que las credenciales. No es el *App Preview* de la ficha, que es
otra cosa y es opcional.

Se graba con la grabación de pantalla del propio iPhone y se pasa a H.264 antes
de subirlo: el iPhone graba en HEVC a 120 fps y deja 50 MB que no hay por qué
pedirle al revisor que descargue y que su reproductor puede no abrir.

```
ffmpeg -i <grabacion>.MP4 -vf "scale=660:-2" -r 30 -c:v libx264 -crf 23 \
       -preset slow -pix_fmt yuv420p -an -movflags +faststart \
       assets/store/trackaria-pro-demo.mp4
```

El recorrido es el de las notas de revisión y en el mismo orden: entrar,
Pendiente, abrir un chat y quitárselo al bot, una cita, las clases del día, una
clase con quién viene, la ficha de un alumno con su bono, y el aviso diciendo a
cuánta gente le va a llegar. Si cambia el recorrido de las notas, se vuelve a
grabar.

## El centro de demostración

Es el mismo que el de la app de clientes y el de Play. Se deja lleno con dos
órdenes en el servidor, y hay que hacerlo **antes de grabar y antes de enviar a
revisar**:

```
python manage.py rellenar_demo --clinica <correo del centro> --esperando 2 --si
python manage.py seed_revisor
```

La primera llena la agenda, los pacientes, los bonos y la bandeja de WhatsApp.
La segunda enciende las clases, las llena con gente apuntada y alguna lista de
espera, y deja al paciente con el teléfono que figura en las notas. El correo
está en `seed_revisor`, que es el único sitio donde vive.

## Privacidad de la app (App Privacy)

- **¿Recopilas datos?** Sí.
- **Información de contacto → Dirección de correo** (la de quien entra):
  funcionalidad de la app · vinculado a la identidad · sin rastreo.
- **Información de contacto → Nombre** (el de quien entra y el de los clientes
  del centro): funcionalidad de la app · vinculado · sin rastreo.
- **Información de contacto → Número de teléfono** (el de los clientes del
  centro): funcionalidad de la app · vinculado · sin rastreo.
- **Contenido del usuario → Mensajes** (las conversaciones de WhatsApp del
  centro): funcionalidad de la app · vinculado · sin rastreo.
- **Identificadores → ID de usuario:** funcionalidad de la app · vinculado · sin
  rastreo.
- **Identificadores → ID del dispositivo** (el token de notificaciones):
  funcionalidad de la app · vinculado · sin rastreo.
- **Otros datos** (citas, reservas, bonos y asistencia): funcionalidad de la app
  · vinculado · sin rastreo.
- **Rastreo (tracking):** no. No hay publicidad ni analítica de terceros.
- Nada de ubicación, contactos, salud, forma física, fotos, compras,
  identificadores publicitarios ni datos de uso.

Las filas de teléfono y mensajes son la diferencia con la app de clientes: esta
app enseña y escribe datos de terceros. Si no se declaran y el revisor abre un
chat, el rechazo es por declaración incompleta, que es peor que haberlo contado.

**Salud se dejó sin declarar**, a sabiendas. La ficha de una cita enseña el
motivo —«fascitis plantar»—, que encaja con el «cualquier otro dato de salud o
médico» de Apple, pero es un renglón de agenda y no una historia clínica: no hay
HealthKit, ni medidas, ni seguimiento clínico. Si algún día el motivo de la cita
pasa a ser texto libre de verdad, hay que volver a mirarlo.

Cada tipo lleva las mismas tres respuestas: **Funcionalidad de la app**,
**vinculado a la identidad sí**, **rastreo no**. Lo de vinculado es sí también
en los mensajes: van dentro de una conversación con una persona con nombre y
teléfono, no hay nada anonimizado.

No se pregunta por el cifrado de exportación: `ITSAppUsesNonExemptEncryption`
ya va en `false` dentro de `app.json`.

## Capturas

iPhone de 6,9" (1320 × 2868). Las monta `scripts/capturas.py` a partir de las
mismas capturas en crudo que las de Play, que viven en `assets/store/capturas/`:

```
python3 scripts/capturas.py
```

Deja un `apple/` al lado del `play/`. Son las mismas capturas con otro lienzo y
una no sirve para la otra tienda: Play no admite nada más alargado que 9:16 y
Apple exige el tamaño exacto. El orden es el mismo en las dos para que las dos
fichas cuenten lo mismo; está en la lista `TITULARES` del script y en
[play-store.md](play-store.md).

Las capturas en crudo tienen que venir del iPhone **sin pasar por nada que las
comprima**. Las de Apple son casi un 50 % más grandes que las de Play, así que
una captura que valía allí hay que agrandarla aquí y se nota en la ficha. El
script avisa cuando le toca hacerlo.
