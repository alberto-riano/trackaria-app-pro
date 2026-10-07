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

Esqueleto visual. Las pantallas tiran de `src/lib/mock.ts` porque **todavía no
hay API**: el panel de Trackaria es Django renderizado en servidor y no expone
nada para el profesional. Los tipos de ese fichero son los que queremos pedirle
al servidor cuando toque, para que las pantallas no cambien.

Antes de la app hace falta el paso de servidor: que el bot deje en una cola lo
que necesita una decisión humana.

## Desarrollo

```bash
npm install
npx expo start --go
```

Comparte marca y convenciones con `trackaria-app`: mismo verde, mismos `space` y
`radius`, comentarios en castellano explicando el **porqué**. El morado
(`colors.bot`) es solo del bot y no se usa para nada más.
