# Goddess Studio — Guía Completa de Implementación

## Documento maestro para desarrollo
## Última actualización: 19 de agosto, 2026

---

## RESUMEN DEL PROYECTO

Página web integral para **Goddess Studio**, estudio independiente de uñas, pestañas y cejas en Melipilla, Chile.

### Stack tecnológico
```
Frontend: React + Vite + Tailwind CSS
Backend: Vercel Serverless Functions (TypeScript)
Base de datos: Neon PostgreSQL
Pagos: Mercado Pago (Checkout Pro)
Calendario: Google Calendar API
Emails: Resend (plan gratuito)
WhatsApp: Twilio API ($0.75 USD/mes)
Hosting: Vercel (plan gratuito)
Dominio: goddessstudio.cl (nic.cl)
```

---

## ESTADO ACTUAL (LO QUE YA ESTÁ HECHO)

### ✅ Funcional
- Landing page responsive
- Sistema de reservas con calendario
- Mercado Pago (Checkout Pro) - pago completo
- Google Calendar sync
- Email confirmación (Resend)
- Email recordatorio 24h (cron job)
- Panel de administración con estadísticas
- Reagendamiento por link
- 404 y ErrorBoundary

### ✅ API Endpoints
- GET /api/services
- GET /api/time-slots
- POST /api/create-preference
- GET /api/bookings
- GET /api/bookings/:id
- PUT /api/bookings/:id/reschedule
- POST /api/webhooks/mercadopago
- POST /api/admin/session
- GET /api/admin/stats
- GET /api/cron/reminders

### ✅ Base de datos
- services (4 servicios predefinidos)
- bookings (con todos los campos actuales)
- blocked_times

---

## LO QUE SE VA A IMPLEMENTAR

### Prioridad ALTA

#### 1. Sistema de Depósito + Saldo Pendiente
```
- Depósito fijo: $5.000 CLP al agendar
- Saldo pendiente: se paga después del servicio
- Métodos: Mercado Pago o efectivo/transferencia (manual)
- Política: reagendar +24h = depósito se mantiene
- Política: reagendar -24h = pierde depósito
```

#### 2. WhatsApp Automatizado (Twilio)
```
- Confirmación de cita (automático)
- Recordatorio 24h antes (automático)
- Recordatorio 1h antes (automático)
- Seguimiento post-servicio (automático)
- Reagendamiento por chat (semi-automático)
- Costo: $0.75 USD/mes (~$700 CLP)
```

#### 3. Panel de Administración Mejorado
```
- Estado de pago visible (depósito/total)
- Botón "Generar link MP" para saldo
- Botón "Marcar pagado" para efectivo
- Historial de pagos por clienta
- Marcar como "no show"
- Dashboard de finanzas
```

#### 4. Comprobante de Pago
```
- Descargable como imagen
- Incluye: servicio, fecha, monto, políticas
- Enviado por email y WhatsApp
```

### Prioridad MEDIA

#### 5. Historial de Clientas
```
- Total de visitas
- Total gastado
- Última visita
- Notas y preferencias
- Fotos del trabajo
```

#### 6. Reagendamiento Mejorado
```
- Validación de 24 horas
- Actualización automática de Google Calendar
- Notificación al admin
- Contador de reagendamientos
```

#### 7. SEO Optimizado
```
- Meta tags (title, description)
- Open Graph para redes sociales
- Schema.org para negocio local
- sitemap.xml
- robots.txt
```

### Prioridad BAJA

#### 8. Cotizador de Uñas
```
- Selección de complejidad (simple/medio/complejo)
- Precio estimado
- Envío de cotización por email
```

#### 9. Galería Antes/Después
```
- Fotos por servicio
- Antes y después
- Subida desde admin
```

#### 10. Instagram Feed Embebido
```
- Últimas publicaciones
- Actualización automática
```

---

## CAMBIOS DE MARCA

### Nombre
```
Antes: Itablooom Studio
Ahora: Goddess Studio
Subtítulo: Uñas, Pestañas y Cejas en Melipilla
```

### Colores
```css
/* Paleta Goddess Studio */
--rosa-pastel: #fae8e9;
--dorado: #c4a265;
--nude: #f5e6d3;
--crema: #faf6ef;
--marron-oscuro: #14100e;

/* Uso */
rosa-pastel: Fondos de secciones, botones principales
dorado: Detalles, acentos, títulos importantes
nude: Fondos secundarios, tarjetas
crema: Fondo general de la página
marron-oscuro: Textos principales, headers
```

### Textos
```
Hero: "Goddess Studio"
Subtítulo: "Uñas, Pestañas y Cejas en Melipilla"
CTA: "Agendar Ahora"
Footer: "Diseñado y desarrollado por BS Digital Tech"
```

---

## BASE DE DATOS

### Tabla bookings (ACTUALIZAR)

```sql
CREATE TABLE IF NOT EXISTS bookings (
  -- Datos básicos
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id),
  
  -- Datos del cliente
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  client_rut VARCHAR(20),
  
  -- Datos de la reserva
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  notes TEXT,
  
  -- Estado
  status VARCHAR(50) DEFAULT 'pending',
  -- Estados: pending, confirmed, completed, cancelled, no_show
  
  -- Depósito
  deposit_amount INTEGER DEFAULT 5000,
  deposit_paid BOOLEAN DEFAULT false,
  deposit_paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Saldo pendiente
  total_amount INTEGER NOT NULL,
  remaining_amount INTEGER,
  remaining_paid BOOLEAN DEFAULT false,
  remaining_paid_method VARCHAR(20),
  -- Métodos: mp, cash, transfer
  remaining_paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Pagos
  payment_id VARCHAR(255),
  
  -- Calendario
  calendar_event_id VARCHAR(255),
  
  -- Notificaciones
  confirmation_sent BOOLEAN DEFAULT false,
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_1h_sent BOOLEAN DEFAULT false,
  followup_sent BOOLEAN DEFAULT false,
  review_sent BOOLEAN DEFAULT false,
  
  -- WhatsApp
  whatsapp_confirmation_sid VARCHAR(255),
  whatsapp_reminder_sid VARCHAR(255),
  
  -- Reagendamiento
  original_date DATE,
  original_time TIME,
  reschedule_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla client_history (NUEVA)

```sql
CREATE TABLE IF NOT EXISTS client_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email VARCHAR(255) NOT NULL UNIQUE,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  total_visits INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_visit_date DATE,
  notes TEXT,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla service_photos (NUEVA)

```sql
CREATE TABLE IF NOT EXISTS service_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  client_email VARCHAR(255) NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type VARCHAR(20),
  -- Tipos: before, after, process
  service_name VARCHAR(255),
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla whatsapp_logs (NUEVA)

```sql
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  to_number VARCHAR(50) NOT NULL,
  message_type VARCHAR(50),
  -- Tipos: confirmation, reminder_24h, reminder_1h, followup, reschedule
  message_sid VARCHAR(255),
  status VARCHAR(50),
  -- Estados: queued, sent, delivered, failed
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);
```

---

## API ENDPOINTS NUEVOS

### POST /api/bookings/:id/remaining-payment
```typescript
// Registrar pago de saldo pendiente
Body: {
  amount: number,
  method: 'mp' | 'cash' | 'transfer',
  mp_payment_id?: string
}

Response: { success: boolean, booking: Booking }

// Lógica:
// 1. Actualizar remaining_paid=true
// 2. Actualizar remaining_paid_method
// 3. Actualizar remaining_paid_at
// 4. Si method='mp', verificar pago
// 5. Actualizar status='completed'
// 6. Sumar a finanzas
// 7. Actualizar client_history
```

### POST /api/bookings/:id/generate-remaining-link
```typescript
// Generar link de MP para saldo pendiente
Response: { init_point: string, amount: number }

// Lógica:
// 1. Calcular remaining_amount = total_amount - deposit_amount
// 2. Crear preferencia de MP
// 3. Retornar URL de pago
```

### PUT /api/bookings/:id/mark-no-show
```typescript
// Marcar como no se presentó
Response: { success: boolean }

// Lógica:
// 1. Actualizar status='no_show'
// 2. El depósito queda como ingreso
// 3. Liberar horario
// 4. Notificar al admin
```

### POST /api/whatsapp/send
```typescript
// Enviar mensaje de WhatsApp
Body: {
  to: string,
  template: 'confirmation' | 'reminder_24h' | 'reminder_1h' | 'followup',
  variables: object
}

Response: { success: boolean, sid: string }

// Lógica:
// 1. Validar número
// 2. Generar mensaje desde plantilla
// 3. Enviar vía Twilio
// 4. Registrar en whatsapp_logs
```

### GET /api/clients/:email
```typescript
// Obtener historial de clienta
Response: {
  client: ClientHistory,
  bookings: Booking[],
  photos: Photo[]
}
```

### PUT /api/clients/:email/notes
```typescript
// Actualizar notas de clienta
Body: { notes: string }
Response: { success: boolean }
```

### GET /api/admin/finances
```typescript
// Obtener resumen financiero
Query: ?period=daily|weekly|monthly&date=YYYY-MM-DD

Response: {
  deposits: { count: number, total: number },
  remainingPayments: {
    mp: { count: number, total: number },
    cash: { count: number, total: number },
    transfer: { count: number, total: number }
  },
  totalRevenue: number,
  pendingAmount: number
}
```

---

## SERVICIOS EXTERNOS

### Twilio (WhatsApp)

#### Variables de entorno
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

#### Instalación
```bash
npm install twilio
```

#### Código de envío
```typescript
// api/lib/twilio.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsApp(to: string, body: string) {
  const message = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${to}`,
    body
  });
  return message.sid;
}
```

#### Plantillas de mensajes

```typescript
// api/templates/whatsapp.ts

export const whatsappTemplates = {
  confirmation: (data: {
    name: string;
    date: string;
    time: string;
    service: string;
    total: number;
    deposit: number;
  }) => `
✅ Hola ${data.name}, tu cita en Goddess Studio está confirmada

📅 ${data.date}
🕐 ${data.time}
💅 ${data.service}
💰 Total: $${data.total.toLocaleString()} | Depósito: $${data.deposit.toLocaleString()} pagado

⚠️ Cancela o reagenda con 24h de anticipación.

¡Te esperamos! 💕
  `.trim(),

  reminder24h: (data: {
    name: string;
    date: string;
    time: string;
    service: string;
  }) => `
⏰ Hola ${data.name}, te recordamos tu cita mañana

📅 ${data.date}
🕐 ${data.time}
💅 ${data.service}

¿Necesitas reagendar? Escríbenos antes de 24 horas.

¡Nos vemos mañana! 💕
  `.trim(),

  reminder1h: (data: { name: string }) => `
🔔 ${data.name}, tu cita es en 1 hora

Te esperamos en Goddess Studio 💅

¡Pronto te atendemos!
  `.trim(),

  followup: (data: {
    name: string;
    service: string;
  }) => `
✨ Hola ${data.name}, ¿cómo quedó tu ${data.service}?

Si tienes alguna consulta, escríbenos.
Si quedaste contenta, ¿nos regalas una reseña?

⭐ https://goddessstudio.cl/reseñas
  `.trim()
};
```

### Mercado Pago

#### Variables de entorno
```bash
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
```

#### Código para saldo pendiente
```typescript
// api/lib/mercadopago.ts
import { MercadoMpPagoConfig, Preference } from 'mercadopago';

const client = new MercadoMpPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

export async function createRemainingPaymentPreference(data: {
  bookingId: string;
  serviceName: string;
  amount: number;
  clientName: string;
  date: string;
  time: string;
}) {
  const preference = new Preference(client);
  
  return await preference.create({
    body: {
      items: [{
        id: data.bookingId,
        title: `${data.serviceName} - Saldo pendiente`,
        description: `Saldo restante para ${data.date} a las ${data.time}`,
        quantity: 1,
        unit_price: data.amount,
        currency_id: 'CLP'
      }],
      external_reference: `${data.bookingId}_remaining`,
      back_urls: {
        success: `${process.env.APP_URL}/confirmacion?status=approved&booking=${data.bookingId}`,
        failure: `${process.env.APP_URL}/confirmacion?status=failure&booking=${data.bookingId}`,
        pending: `${process.env.APP_URL}/confirmacion?status=pending&booking=${data.bookingId}`
      },
      auto_return: 'approved',
      notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`
    }
  });
}
```

### Google Calendar

#### Variables de entorno
```bash
GOOGLE_CALENDAR_ID=goddessstudio@gmail.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=calendar-bot@...iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

---

## FLUJOS PRINCIPALES

### Flujo de Reserva Completo

```
1. CLIENTE entra a la web
2. Selecciona servicio
3. Elige fecha y hora
4. Ingresa datos personales
5. Paga depósito ($5.000) con MP
6. Webhook confirma pago
7. Sistema ejecuta:
   a. Actualiza reserva a status='confirmed'
   b. Marca deposit_paid=true
   c. Crea evento en Google Calendar
   d. Envía WhatsApp de confirmación (Twilio)
   e. Envía email de confirmación (Resend)
   f. Actualiza o crea client_history
8. Cliente ve confirmación en la web
9. Cliente recibe WhatsApp
10. Cliente recibe email con comprobante
```

### Flujo de Reagendamiento

```
1. CLIENTE hace clic en "Reagendar" (desde email)
2. Sistema valida: ¿faltan >24 horas?
   - NO → Mensaje: "No es posible reagendar con menos de 24 horas"
   - SÍ → Continúa
3. Sistema muestra horarios disponibles del mismo servicio
4. CLIENTE elige nuevo día y hora
5. Sistema valida disponibilidad
6. CLIENTE confirma
7. Sistema ejecuta:
   a. Guarda original_date y original_time
   b. Actualiza booking_date y booking_time
   c. Incrementa reschedule_count
   d. Libera blocked_time anterior
   e. Crea nuevo blocked_time
   f. Actualiza Google Calendar
   g. Envía WhatsApp de confirmación
   h. Envía email de confirmación
8. Cliente recibe nueva confirmación
```

### Flujo de Pago de Saldo

```
1. ADMIN ve cita con depósito pagado en el panel
2. ADMIN hace clic en "Registrar pago"
3. ADMIN elige opción:
   a. Generar link MP → Se crea link → Se envía por WhatsApp
   b. Marcar manual → Ingresa monto y método (efectivo/transferencia)
4. Sistema ejecuta:
   a. Actualiza remaining_paid=true
   b. Actualiza remaining_paid_method
   c. Actualiza remaining_paid_at
   d. Calcula remaining_amount
   e. Actualiza status='completed'
   f. Suma a finanzas del día
   g. Actualiza client_history
5. Admin ve check verde en la cita
```

### Flujo de No Show

```
1. ADMIN marca cita como "no se presentó"
2. Sistema ejecuta:
   a. Actualiza status='no_show'
   b. El depósito ($5.000) queda como ingreso
   c. Libera el horario
   d. Envía notificación al admin
3. La cita aparece como "no show" en el historial
```

---

## COMPONENTES FRONTEND NUEVOS

### ReviewModal.tsx
```tsx
// Popup que aparece después del pago aprobado
// Pregunta: "¿Qué te pareció tu experiencia?"
// Botón: "Dejar reseña en Google"
// Se puede cerrar (X)
// Solo aparece una vez (localStorage)
```

### Comprobante.tsx
```tsx
// Comprobante de pago descargable
// Muestra: servicio, fecha, hora, monto, políticas
// Botón: "Descargar comprobante"
// Se genera como imagen (html2canvas)
```

### RemainingPaymentModal.tsx
```tsx
// Modal para registrar pago de saldo
// Muestra: monto pendiente, opciones de pago
// Opción 1: Generar link MP
// Opción 2: Marcar manual (monto + método)
// Confirma y actualiza
```

### ClientHistory.tsx
```tsx
// Historial completo de una clienta
// Muestra: visitas, gasto total, últimas citas
// Notas del admin (editable)
// Fotos del trabajo
```

### WhatsAppButton.tsx
```tsx
// Botón de WhatsApp por cada cita
// Abre WhatsApp con mensaje predefinido
// Mensaje incluye: nombre, fecha, servicio
```

---

## VARIABLES DE ENTORNO COMPLETAS

```bash
# Base de datos
DATABASE_URL=postgresql://neondb_owner:npg_xxx@ep-xxx.neon.tech/neondb?sslmode=require

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxx

# Google Calendar
GOOGLE_CALENDAR_ID=goddessstudio@gmail.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=calendar-bot@i-woodland-498215-v8.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----"

# Resend
RESEND_API_KEY=re_xxx

# Twilio (NUEVO)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Admin
ADMIN_PASSWORD=tulogin123
CRON_SECRET=itablooom-cron-2026

# App
APP_URL=https://goddessstudio.cl
OWNER_EMAIL=goddessstudio@gmail.com
```

---

## ORDEN DE IMPLEMENTACIÓN

### Día 1-2: Base de datos + Sistema de depósito
1. Crear tablas nuevas (client_history, service_photos, whatsapp_logs)
2. Actualizar tabla bookings
3. Implementar POST /api/bookings/:id/remaining-payment
4. Implementar POST /api/bookings/:id/generate-remaining-link
5. Implementar PUT /api/bookings/:id/mark-no-show
6. Modificar webhook de MP para detectar depósito vs saldo

### Día 3-4: WhatsApp Twilio
1. Configurar cuenta de Twilio
2. Instalar SDK de Twilio
3. Crear api/lib/twilio.ts
4. Crear api/templates/whatsapp.ts
5. Implementar POST /api/whatsapp/send
6. Integrar con flujo de reserva (confirmación)
7. Implementar recordatorios (cron job)
8. Integrar con reagendamiento

### Día 5-6: Panel de administración
1. Agregar estado de pago en lista de citas
2. Implementar RemainingPaymentModal
3. Agregar botón "Generar link MP"
4. Agregar botón "Marcar pagado"
5. Implementar POST /api/admin/finances
6. Dashboard de finanzas mejorado
7. Marcar como "no show"

### Día 7-8: Reagendamiento + Comprobante
1. Mejorar flujo de reagendamiento
2. Validación de 24 horas
3. Actualización de Google Calendar
4. Implementar Comprobante.tsx
5. Descarga de comprobante como imagen
6. Envío de comprobante por email/WhatsApp

### Día 9-10: Historial de clientas + Frontend
1. Implementar GET /api/clients/:email
2. Implementar ClientHistory.tsx
3. Implementar ReviewModal.tsx
4. Integrar con panel de admin
5. Notas de clienta

### Día 11-12: Cambios de marca
1. Actualizar colores CSS
2. Actualizar textos (nombre, servicios)
3. Cambiar hero section
4. Actualizar footer
5. Cambiar títulos y descripciones

### Día 13: SEO
1. Actualizar index.html (meta tags)
2. Agregar Open Graph
3. Agregar Schema.org
4. Crear sitemap.xml
5. Crear robots.txt

### Día 14: Pruebas
1. Probar flujo completo de reserva
2. Probar reagendamiento
3. Probar pago de saldo
4. Probar WhatsApp
5. Probar admin
6. Corregir errores

### Día 15: Deploy
1. Build y deploy a Vercel
2. Configurar variables de entorno
3. Configurar dominio
4. Monitorear
5. Documentar

---

## POLÍTICAS DE NEGOCIO

### Cancelación
- Más de 24 horas antes: reembolso total
- Menos de 24 horas: depósito no reembolsable

### Reagendamiento
- Más de 24 horas antes: depósito se mantiene
- Menos de 24 horas: no es posible reagendar

### No Show
- No se presenta: depósito queda como ingreso
- Horario se libera automáticamente

### Pago
- Depósito: $5.000 al agendar (MP)
- Saldo: se paga después del servicio (MP o efectivo)

---

## NOTAS PARA EL DESARROLLADOR

1. **NO romper funcionalidad existente** — Todo lo que ya funciona debe seguir funcionando
2. **Mantener compatibilidad** — Las reservas antiguas deben seguir visibles
3. **Probar en celular** — La mayoría de las clientas usan celular
4. **Manejar errores** — Si Twilio falla, que no rompa la reserva
5. **Logging** — Guardar logs de WhatsApp para debugging
6. **Variables de entorno** — Todo configurable, sin hardcoded

---

**Documento preparado por:** BS Digital Tech
**Fecha:** 19 de agosto, 2026
**Versión:** 1.0
