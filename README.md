# Trackaria Pro

La app del **negocio**: el centro que tiene un WhatsApp Business contestando por
él y la agenda llevada por Trackaria.

No confundir con `trackaria-app` («Trackaria» a secas), que es la del **cliente
final** y va de clases —hoy fisioterapia, mañana lo que sea—. Son dos públicos
distintos y por eso son dos apps distintas, con su ficha, sus capturas y sus
valoraciones separadas.

## Qué hace

Las pestañas que le toquen al centro:

- **Pendiente** — lo único que justifica sacar el móvil: quién pide cita y quién
  ha pedido hablar con una persona. Es la pantalla de inicio.
- **Chats** — las conversaciones del WhatsApp del centro, diciendo en cada una
  **quién está contestando**, el bot o tú.
- **Agenda** — el día, para consultar. Solo si el centro tiene consulta.
- **Clases** — las clases del día con sus plazas, y dentro de cada una quién
  viene. Solo si el centro da clases.

«Clases» es lo único que **cambia** datos, y solo dos cosas: apuntar a alguien y
quitarlo. Son las dos que se hacen con una persona delante preguntando, que es
justo lo que no puede esperar a llegar al ordenador. Dos detalles donde no se
comporta como la app del alumno, a propósito: apunta sin mirar los días de
antelación —esa regla existe para que nadie llene la agenda desde su móvil tres
meses antes— y, al quitar a alguien, puede devolverle la clase aunque avise
tarde, porque una urgencia la juzga el mostrador y no el reloj.

## Qué NO hace, a propósito

Configuración, ajustes del bot, horarios, profesionales, Google Maps, cambio de
suscripción y tickets de soporte **se quedan en el panel web**. También los
horarios de las clases, sus instructores y sus plazas: mover eso cambia la
semana entera de un centro. Tres motivos:

1. Son operaciones con consecuencias (tocan el calendario de Google, avisan a
   pacientes, cambian lo que se factura) y quieren una pantalla grande.
2. Mantienen la app pequeña, y con ella la superficie que revisan Apple y Google.
3. Al no vender ni cambiar la suscripción dentro de la app, no entran en juego
   las normas de compra integrada de Apple.

## Estado

Funciona contra el servidor de verdad. Se entra con la **misma cuenta del panel**
—correo y contraseña—, y la clave se guarda en el llavero del móvil.

La API es `/api/pro/v1/` (app `pro_app` del repo del servidor). «Pendiente» junta
dos cosas: los relevos que dejó el bot —quien pidió hablar con una persona y
donde el bot se atascó— y las citas que creó sin confirmar.

Falta: avisos push cuando entra algo en la cola.

## Desarrollo

```bash
npm install
npx expo start --go
```

Apunta a producción por defecto. Para desarrollar contra el Django de tu Mac,
descomenta la otra línea de `.env.local` con la IP de tu Mac en la wifi de ese
momento: el móvil no sabe qué es «localhost».

Comparte marca y convenciones con `trackaria-app`: mismo verde, mismos `space` y
`radius`, comentarios en castellano explicando el **porqué**. El morado
(`colors.bot`) es solo del bot y no se usa para nada más.
