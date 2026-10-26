-- Sistema de depósito + saldo pendiente + no-show.
--
-- Solo ADD COLUMN IF NOT EXISTS: es idempotente y no toca datos existentes.
-- Las reservas anteriores quedan con remaining_paid = false, que es correcto
-- (su saldo se cobró fuera del sistema).
--
-- remaining_amount NO se guarda a propósito: se calcula como
-- total_amount - deposit_amount. Guardado se desincroniza en cuanto cambia
-- un precio.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_paid BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_paid_at TIMESTAMPTZ;

-- mp | cash | transfer
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_paid_method VARCHAR(20);

-- Momento en que se marcó la inasistencia; el depósito queda como ingreso.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show_at TIMESTAMPTZ;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- La agenda del panel siempre filtra por fecha; sin índice hace scan completo.
CREATE INDEX IF NOT EXISTS idx_bookings_fecha ON bookings (booking_date);

-- El webhook busca por payment_id en cada notificación de Mercado Pago.
CREATE INDEX IF NOT EXISTS idx_bookings_payment ON bookings (payment_id);

-- Panel instalable: Face ID y avisos push.
--
-- Solo CREATE TABLE IF NOT EXISTS: idempotente, no toca tablas existentes.
-- El servidor también las crea solo la primera vez que el panel las usa
-- (api/_shared/panel/tablas.ts); acá quedan documentadas.

-- Llaves de Face ID / huella (WebAuthn). Se guarda solo la llave pública:
-- la biometría nunca sale del teléfono.
CREATE TABLE IF NOT EXISTS admin_llaves (
  id TEXT PRIMARY KEY,
  llave_publica TEXT NOT NULL,
  contador BIGINT NOT NULL DEFAULT 0,
  transportes TEXT[],
  aparato VARCHAR(40),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_uso TIMESTAMPTZ
);

-- Desafíos de un solo uso para cada ceremonia de Face ID; viven 5 minutos.
CREATE TABLE IF NOT EXISTS admin_desafios (
  id TEXT PRIMARY KEY,
  desafio TEXT NOT NULL,
  vence_en TIMESTAMPTZ NOT NULL
);

-- Suscripciones push de los aparatos de Ignacia (teléfono, computador).
CREATE TABLE IF NOT EXISTS admin_suscripciones (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  aparato VARCHAR(40),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_envio TIMESTAMPTZ
);
