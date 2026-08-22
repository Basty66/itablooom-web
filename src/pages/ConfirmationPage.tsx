import { useLocation, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, CalendarDays, Clock3, Sparkles, XCircle,
  ArrowLeft, MessageCircle, Loader2, MapPin, CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect, useCallback } from 'react';
import type { Booking } from '../types';
import { getBookingById, checkPaymentStatus } from '../lib/api';
import { formatPrice } from '../lib/format';
import Button from '../components/ui/Button';
import { Container } from '../components/ui/Section';
import { linkWhatsApp } from '../lib/contacto';

const WHATSAPP = linkWhatsApp('Hola! Acabo de agendar una cita');

/** Parsea "2026-08-19" o Date sin shift de timezone. */
function parseDateLocal(raw: string | Date): Date {
  if (raw instanceof Date) {
    return new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
  }
  const s = String(raw).split('T')[0];
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function Estado({
  icono,
  titulo,
  texto,
  tono = 'exito',
}: {
  icono: typeof CheckCircle2;
  titulo: string;
  texto: string;
  tono?: 'exito' | 'error';
}) {
  const Icono = icono;
  return (
    <div className="text-center">
      <span
        className={`anim-velo mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-dorado-400/50 ${
          tono === 'exito' ? 'superficie' : 'bg-tinta-850'
        }`}
      >
        <Icono size={36} strokeWidth={1.3} className="text-crema-100" aria-hidden="true" />
      </span>
      <h1 className="texto-4 text-crema-100">{titulo}</h1>
      <p className="mx-auto mt-3 max-w-md text-nacar-200/80">{texto}</p>
    </div>
  );
}

function Acciones({ bookingId, email }: { bookingId?: string; email?: string }) {
  const rescheduleUrl = bookingId && email
    ? `/reagendar?id=${bookingId}&email=${encodeURIComponent(email)}`
    : '/reagendar';

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Button to="/" variant="outline" size="md">
        <ArrowLeft size={17} strokeWidth={1.5} />
        Volver al inicio
      </Button>
      <Button to={rescheduleUrl} variant="ghost" size="md">
        Reagendar cita
      </Button>
      <Button href={WHATSAPP} variant="secondary" size="md">
        <MessageCircle size={17} strokeWidth={1.5} />
        Escribinos por WhatsApp
      </Button>
    </div>
  );
}

export default function ConfirmationPage() {
  const [searchParams] = useSearchParams();
  const state = useLocation().state as { booking?: Booking } | null;

  const [booking, setBooking] = useState<Booking | null>(state?.booking ?? null);
  const [cargando, setCargando] = useState(!state?.booking);

  const status = searchParams.get('status');
  const bookingId = searchParams.get('booking');

  const cargar = useCallback(
    async (id: string) => {
      try {
        const data = await getBookingById(id);
        if (data) {
          setBooking(data);
          // El webhook puede tardar: si el pago está aprobado pero la reserva
          // todavía no, forzamos la sincronización.
          if (status === 'approved' && !data.deposit_paid) {
            await checkPaymentStatus(id);
            const actualizado = await getBookingById(id);
            if (actualizado) setBooking(actualizado);
          }
        }
      } catch (error) {
        console.error('Error loading booking:', error);
      } finally {
        setCargando(false);
      }
    },
    [status]
  );

  useEffect(() => {
    if (bookingId && !booking) cargar(bookingId);
    else if (!bookingId && !booking) setCargando(false);
  }, [bookingId, booking, cargar]);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tinta-900">
        <Loader2 size={34} strokeWidth={1.3} className="animate-spin text-dorado-500" aria-hidden="true" />
        <span className="sr-only">Cargando tu reserva…</span>
      </div>
    );
  }

  if (status === 'failure') {
    return (
      <div className="flex min-h-screen items-center bg-tinta-900 py-16">
        <Container className="max-w-xl">
          <Estado
            icono={XCircle}
            tono="error"
            titulo="El pago no se completó"
            texto="No se realizó ningún cobro y el horario quedó disponible otra vez. Puedes intentarlo nuevamente cuando quieras."
          />
          <div className="mt-8 flex justify-center">
            <Button to="/agendar" size="md">
              Intentar nuevamente
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center bg-tinta-900 py-16">
        <Container className="max-w-xl">
          <Estado
            icono={CheckCircle2}
            titulo="¡Pago aprobado!"
            texto="Tu pago se procesó correctamente y tu hora quedó agendada."
          />
          <Acciones />
        </Container>
      </div>
    );
  }

  // `deposit_amount` guarda lo efectivamente cobrado: si la clienta eligió
  // pagar todo, ahí queda el total y el saldo da cero.
  const pagado = Number(booking.deposit_amount) || 0;
  const totalServicio = Number(booking.total_amount) || 0;
  const saldoPendiente = booking.remaining_paid ? 0 : Math.max(totalServicio - pagado, 0);

  return (
    <div className="min-h-screen bg-tinta-900 py-14 md:py-20">
      <Container className="max-w-2xl">
        <Estado
          icono={CheckCircle2}
          titulo="¡Tu cita quedó confirmada!"
          texto="Ya reservamos tu horario. Te esperamos el día de tu sesión."
        />

        <div className="mt-10 linea-oro border superficie p-6 sm:p-8">
          <h2 className="texto-2 mb-6 text-crema-100">Detalle de tu reserva</h2>

          <dl className="space-y-5">
            {[
              {
                icono: Sparkles,
                label: 'Tratamiento',
                valor: booking.service_name || 'Servicio',
              },
              {
                icono: CalendarDays,
                label: 'Fecha',
                valor: booking.booking_date
                  ? format(parseDateLocal(booking.booking_date), "EEEE d 'de' MMMM, yyyy", { locale: es })
                  : 'Por confirmar',
              },
              {
                icono: Clock3,
                label: 'Hora',
                valor: booking.booking_time ? String(booking.booking_time).slice(0, 5) : '—',
              },
            ].map(({ icono: Icono, label, valor }) => (
              <div key={label} className="flex items-start gap-4">
                <span className="linea-oro flex h-11 w-11 shrink-0 items-center justify-center border">
                  <Icono size={18} strokeWidth={1.5} className="text-crema-100/90" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="texto--1 text-nacar-300">{label}</dt>
                  <dd className="texto-0 font-medium capitalize text-crema-100">{valor}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-7 linea-oro border-t pt-6">
            <h3 className="mb-4 flex items-center gap-2 texto-1 text-crema-100">
              <CreditCard size={17} strokeWidth={1.5} className="text-dorado-300" aria-hidden="true" />
              Resumen de pago
            </h3>
            {/*
              Antes decía "Pagado" y mostraba total_amount: quien abonaba
              $5.000 de un servicio de $16.000 veía $16.000 como pagados.
              El saldo se calcula, no se guarda: así no se desincroniza si el
              precio del servicio cambia después de la reserva.
            */}
            <dl className="space-y-2.5 texto--1">
              <div className="flex justify-between gap-4">
                <dt className="text-nacar-200/80">
                  {saldoPendiente > 0 ? 'Abonaste' : 'Pagaste'}
                </dt>
                <dd className="font-medium text-crema-100">{formatPrice(pagado)}</dd>
              </div>

              {saldoPendiente > 0 && (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-nacar-200/80">Saldo a pagar en el local</dt>
                    <dd className="font-medium text-crema-100">{formatPrice(saldoPendiente)}</dd>
                  </div>
                  <div className="linea-oro flex justify-between gap-4 border-t pt-2.5">
                    <dt className="text-nacar-300">Valor del servicio</dt>
                    <dd className="text-nacar-300">{formatPrice(totalServicio)}</dd>
                  </div>
                </>
              )}

              {saldoPendiente === 0 && (
                <p className="text-nacar-300">Tu servicio queda pagado por completo.</p>
              )}
            </dl>
          </div>

          <div className="mt-7 linea-oro border-t p-0 pt-6">
            <h3 className="mb-3 texto-0 font-medium text-crema-100">Antes de tu cita</h3>
            <ul className="space-y-2 texto--1 text-nacar-200/80">
              {[
                'Llega 5 minutos antes para acomodarte con calma.',
                'Si es depilación láser, ven con la zona rasurada y sin exposición solar reciente.',
                'Para tratamientos faciales, preferentemente sin maquillaje.',
                'Si necesitás reagendar, hacelo con 24h de anticipación desde el link de tu confirmación.',
              ].map((linea) => (
                <li key={linea} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-dorado-400"
                  />
                  {linea}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-2 texto--1 text-nacar-300">
              <MapPin size={14} strokeWidth={1.5} className="text-dorado-300" aria-hidden="true" />
              Santiago, Chile
            </p>
          </div>
        </div>

        <Acciones bookingId={booking.id} email={booking.client_email} />
      </Container>
    </div>
  );
}
