/**
 * Una reserva `pending` retiene el horario solo mientras la clienta paga.
 * Pasado ese plazo el cupo se libera solo.
 *
 * No usamos un cron: en Vercel Hobby los cron jobs corren como mucho 1 vez al
 * día, inútil para una ventana de minutos. En vez de eso filtramos al leer
 * (`activeBookingFilter`), que da el resultado correcto siempre, y además
 * limpiamos de forma oportunista para que el estado real quede en la DB.
 */
export const RESERVA_TTL_MINUTOS = 10;

/**
 * Marca como canceladas las reservas pending que nunca se pagaron.
 * Es idempotente y barato; se puede llamar en cualquier request.
 */
export async function expirarReservasVencidas(sql: any): Promise<number> {
  const expiradas = await sql`
    UPDATE bookings
    SET status = 'cancelled'
    WHERE status = 'pending'
      AND created_at < NOW() - (${RESERVA_TTL_MINUTOS} * INTERVAL '1 minute')
    RETURNING id
  `;
  return expiradas.length;
}
