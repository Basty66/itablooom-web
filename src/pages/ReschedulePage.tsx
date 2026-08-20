import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Clock3, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Container } from '../components/ui/Section';
import { getAvailableTimeSlots } from '../lib/api';
import type { TimeSlot } from '../types';
import { linkWhatsApp } from '../lib/contacto';

const WHATSAPP = linkWhatsApp('Hola! Necesito reagendar mi cita');

export default function ReschedulePage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [verificado, setVerificado] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  const DIAS_VISIBLES = 14;
  const hoy = startOfDay(new Date());
  const dias = Array.from({ length: DIAS_VISIBLES }, (_, i) => addDays(hoy, i + 1)); // +1 para no incluir hoy

  const cargarSlots = useCallback(async () => {
    if (!fecha || !booking) return;
    setCargandoSlots(true);
    try {
      setSlots(await getAvailableTimeSlots(format(fecha, 'yyyy-MM-dd'), booking.service_id));
    } catch {
      setSlots([]);
    } finally {
      setCargandoSlots(false);
    }
  }, [fecha, booking]);

  useEffect(() => {
    if (fecha && booking) cargarSlots();
  }, [fecha, booking, cargarSlots]);

  async function verificar() {
    if (!bookingId || !email) return;
    setError('');
    try {
      const res = await fetch(`/api/bookings?id=${bookingId}`);
      const data = await res.json();
      if (!res.ok || !data) {
        setError('Reserva no encontrada');
        return;
      }
      if (data.client_email !== email) {
        setError('El email no coincide con la reserva');
        return;
      }
      if (data.status !== 'confirmed') {
        setError('Solo se pueden reagendar reservas confirmadas');
        return;
      }
      // Verificar 24h de anticipación
      const fechaCita = new Date(`${String(data.booking_date).split('T')[0]}T${String(data.booking_time).slice(0, 5)}:00`);
      const horas = (fechaCita.getTime() - Date.now()) / (1000 * 60 * 60);
      if (horas < 24) {
        setError('Las reservas se deben reagendar con mínimo 24 horas de anticipación. Contactanos por WhatsApp.');
        return;
      }
      setBooking(data);
      setVerificado(true);
    } catch {
      setError('Error al verificar la reserva');
    }
  }

  async function reagendar() {
    if (!booking || !fecha || !hora) return;
    setEnviando(true);
    setError('');
    try {
      const res = await fetch('/api/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          email,
          newDate: format(fecha, 'yyyy-MM-dd'),
          newTime: hora,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al reagendar');
        return;
      }
      setExito(true);
    } catch {
      setError('Error de conexión');
    } finally {
      setEnviando(false);
    }
  }

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-crema-100 py-16">
        <Container className="max-w-lg text-center">
          <AlertCircle size={40} strokeWidth={1.3} className="mx-auto mb-4 text-dorado-700" />
          <h1 className="texto-3 text-tinta-900">Link inválido</h1>
          <p className="mt-3 texto-0 text-tinta-600">Pide a Goddess Studio el link correcto para reagendar.</p>
        </Container>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="min-h-screen bg-crema-100 py-16">
        <Container className="max-w-lg text-center">
          <CheckCircle2 size={48} strokeWidth={1.3} className="mx-auto mb-5 text-emerald-500" />
          <h1 className="texto-3 text-tinta-900">¡Reagendada!</h1>
          <p className="mt-3 texto-0 text-tinta-600">
            Tu nueva cita es el <strong>{format(fecha!, "EEEE d 'de' MMMM", { locale: es })}</strong> a las <strong>{hora}</strong>.
          </p>
          <p className="mt-2 texto--1 text-tinta-500">Te esperamos. Si necesitás algo más, escribinos por WhatsApp.</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crema-100 py-10 md:py-16">
      <Container className="max-w-lg">
        <header className="mb-8 text-center">
          <p className="texto--1 mb-2 font-medium uppercase tracking-[0.2em] text-dorado-700">Reagendar cita</p>
          <h1 className="texto-3 text-tinta-900">
            {verificado ? 'Elegí tu nuevo horario' : 'Verificá tu reserva'}
          </h1>
        </header>

        {error && (
          <div className="mb-6 linea-oro border px-4 py-3 texto--1 text-tinta-800">
            {error}
          </div>
        )}

        {!verificado ? (
          <div className="rounded-3xl border border-tinta-900/8 bg-crema-50/70 p-5 shadow-[0_20px_60px_-40px_rgba(20,16,14,0.5)] sm:p-7">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block texto--1 font-medium text-tinta-700">ID de la reserva</span>
                <input
                  type="text"
                  value={bookingId || ''}
                  disabled
                  className="w-full rounded-xl border border-tinta-900/15 bg-tinta-900/5 px-4 py-3 texto-0 text-tinta-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block texto--1 font-medium text-tinta-700">Tu email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria@ejemplo.cl"
                  className="w-full rounded-xl border border-tinta-900/15 bg-crema-50 px-4 py-3 texto-0 text-tinta-900 placeholder:text-tinta-400 transition-colors focus:border-dorado-500 focus:outline-none"
                />
              </label>
              <button
                onClick={verificar}
                disabled={!email}
                className="w-full bg-tinta-900 px-7 py-3 texto--1 uppercase espaciado-medio text-crema-100 transition-all hover:bg-tinta-800 active:scale-95 disabled:opacity-40"
              >
                Verificar reserva
              </button>
            </div>
            <p className="mt-4 texto--1 text-center text-tinta-500">
              ¿No encontrás tu reserva?{' '}
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-dorado-700 underline">Escribinos</a>
            </p>
          </div>
        ) : (
          <>
            {/* Resumen de la cita actual */}
            <div className="mb-6 rounded-2xl border border-tinta-900/8 bg-crema-50/80 px-4 py-3 text-center">
              <p className="texto--1 text-tinta-500">Tu cita actual</p>
              <p className="mt-1 texto-0 font-medium text-tinta-900">
                {booking.service_name} · {booking.booking_time ? String(booking.booking_time).slice(0, 5) : ''}
              </p>
              <p className="texto--1 text-tinta-500">
                {booking.booking_date
                  ? format(new Date(String(booking.booking_date).split('T')[0] + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })
                  : ''}
              </p>
            </div>

            <div className="rounded-3xl border border-tinta-900/8 bg-crema-50/70 p-5 shadow-[0_20px_60px_-40px_rgba(20,16,14,0.5)] sm:p-7">
              {/* Calendario */}
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 texto-1 text-tinta-900">
                  <CalendarDays size={17} strokeWidth={1.5} className="text-dorado-700" />
                  Elegí el nuevo día
                </h3>
                <div className="grid grid-cols-7 gap-1.5">
                  {dias.map((dia) => {
                    const activo = fecha && format(dia, 'yyyy-MM-dd') === format(fecha, 'yyyy-MM-dd');
                    return (
                      <button
                        key={dia.toISOString()}
                        type="button"
                        onClick={() => { setFecha(dia); setHora(''); }}
                        className={`flex flex-col items-center rounded-xl py-2 transition-all duration-200 ${
                          activo
                            ? 'bg-tinta-900 text-crema-100'
                            : 'text-tinta-800 hover:bg-crema-200 active:scale-95'
                        }`}
                      >
                        <span className="texto--2 capitalize opacity-60">{format(dia, 'EEE', { locale: es }).slice(0, 3)}</span>
                        <span className="text-sm font-medium tabular-nums">{format(dia, 'd')}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 texto--1 text-tinta-500">Solo podés reagendar con 24h de anticipación.</p>
              </div>

              {/* Slots */}
              {fecha && (
                <div className="anim-entrada">
                  <h3 className="mb-3 flex items-center gap-2 texto-1 text-tinta-900">
                    <Clock3 size={17} strokeWidth={1.5} className="text-dorado-700" />
                    Elegí la hora
                  </h3>
                  {cargandoSlots ? (
                    <div className="py-8 text-center texto--1 text-tinta-500">Cargando horarios…</div>
                  ) : slots.filter((s) => s.available).length === 0 ? (
                    <div className="py-8 text-center texto--1 text-tinta-500">No hay horarios disponibles para este día.</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {slots.filter((s) => s.available).map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setHora(slot.time)}
                          className={`rounded-xl py-2.5 texto--1 font-medium tabular-nums transition-all duration-200 ${
                            hora === slot.time
                              ? 'bg-tinta-900 text-crema-100'
                              : 'bg-crema-200/70 text-tinta-800 hover:bg-dorado-200 active:scale-95'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Botón reagendar */}
              {fecha && hora && (
                <div className="mt-6 anim-entrada">
                  <button
                    onClick={reagendar}
                    disabled={enviando}
                    className="w-full bg-tinta-900 px-7 py-3 texto--1 uppercase espaciado-medio text-crema-100 transition-all hover:bg-tinta-800 active:scale-95 disabled:opacity-40"
                  >
                    {enviando ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={17} className="animate-spin" /> Reagendando…
                      </span>
                    ) : (
                      `Reagendar al ${format(fecha, "d 'de' MMMM", { locale: es })} a las ${hora}`
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
