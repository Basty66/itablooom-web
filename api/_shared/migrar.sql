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
