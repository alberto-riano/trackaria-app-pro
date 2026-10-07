# Trackaria Pro

La app del **negocio**: el centro que tiene un WhatsApp Business contestando por
él y la agenda llevada por Trackaria.

No confundir con `trackaria-app` («Trackaria» a secas), que es la del **cliente
final** y va de clases —hoy fisioterapia, mañana lo que sea—. Son dos públicos
distintos y por eso son dos apps distintas, con su ficha, sus capturas y sus
valoraciones separadas.

## Qué hace

Tres pestañas y ninguna más:

- **Pendiente** — lo único que justifica sacar el móvil: quién pide cita y quién
  ha pedido hablar con una persona. Es la pantalla de inicio.
- **Chats** — las conversaciones del WhatsApp del centro, diciendo en cada una
  **quién está contestando**, el bot o tú.
- **Agenda** — el día, para consultar.

## Qué NO hace, a propósito

Configuración, ajustes del bot, horarios, profesionales, Google Maps, cambio de
suscripción y tickets de soporte **se quedan en el panel web**. Tres motivos:

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
