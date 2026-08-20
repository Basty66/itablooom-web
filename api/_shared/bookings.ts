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
 * Horario de atención por día de la semana (0 = domingo).
 *
 * Vive acá y no dentro de time-slots porque el frontend muestra estos mismos
 * horarios: cuando estaban duplicados, la web anunciaba 10:00–20:00 mientras
 * la API ofrecía turnos de 9:00 a 19:00.
 */
export const HORARIO: Record<number, { abre: number; cierra: number } | null> = {
  0: null, // domingo cerrado
  1: { abre: 10, cierra: 20 },
  2: { abre: 10, cierra: 20 },
  3: { abre: 10, cierra: 20 },
  4: { abre: 10, cierra: 20 },
  5: { abre: 10, cierra: 20 },
  6: { abre: 10, cierra: 15 }, // sábado
};

/** Cada cuántos minutos se ofrece un turno. */
export const PASO_MINUTOS = 30;

/**
 * Minutos desde medianoche de un `dateTime` de Google, sin pasar por `Date`.
 *
 * Google devuelve la hora ya en la zona del calendario ("...T15:00:00-04:00"),
 * pero `new Date(x).getHours()` la convierte a la zona del proceso, que en
 * Vercel es UTC: un evento de 15:00 en Chile se leía como 19:00 y bloqueaba
 * la franja equivocada. Leyendo el string directo, la hora es la real.
 */
export function minutosDesdeISO(dateTime: string): number | null {
  const m = /T(\d{2}):(\d{2})/.exec(dateTime);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

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
