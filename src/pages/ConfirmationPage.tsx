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
        className={`anim-velo mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${
          tono === 'exito' ? 'bg-rosa-200' : 'bg-tinta-900/8'
        }`}
      >
        <Icono size={36} strokeWidth={1.3} className="text-tinta-900" aria-hidden="true" />
      </span>
      <h1 className="texto-4 text-tinta-900">{titulo}</h1>
      <p className="mx-auto mt-3 max-w-md text-tinta-600">{texto}</p>
    </div>
  );
}

function Acciones() {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Button to="/" variant="outline" size="md">
        <ArrowLeft size={17} strokeWidth={1.5} />
        Volver al inicio
      </Button>
      <Button href={WHATSAPP} variant="secondary" size="md">
        <MessageCircle size={17} strokeWidth={1.5} />
        Escríbenos por WhatsApp
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
      <div className="flex min-h-screen items-center justify-center bg-crema-100">
        <Loader2 size={34} strokeWidth={1.3} className="animate-spin text-rosa-400" aria-hidden="true" />
        <span className="sr-only">Cargando tu reserva…</span>
      </div>
    );
  }

  if (status === 'failure') {
    return (
      <div className="flex min-h-screen items-center bg-crema-100 py-16">
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
      <div className="flex min-h-screen items-center bg-crema-100 py-16">
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

  const saldo = booking.total_amount - booking.deposit_amount;

  return (
    <div className="min-h-screen bg-crema-100 py-14 md:py-20">
      <Container className="max-w-2xl">
        <Estado
          icono={CheckCircle2}
          titulo="¡Tu cita quedó confirmada!"
          texto="Ya reservamos tu horario. Te esperamos el día de tu sesión."
        />

        <div className="mt-10 rounded-3xl border border-tinta-900/8 bg-crema-50 p-6 shadow-[0_20px_60px_-40px_rgba(20,16,14,0.5)] sm:p-8">
          <h2 className="texto-2 mb-6 text-tinta-900">Detalle de tu reserva</h2>

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
                  ? format(new Date(booking.booking_date), "EEEE d 'de' MMMM, yyyy", { locale: es })
                  : 'Por confirmar',
              },
              {
                icono: Clock3,
                label: 'Hora',
                valor: booking.booking_time ? String(booking.booking_time).slice(0, 5) : '—',
              },
            ].map(({ icono: Icono, label, valor }) => (
              <div key={label} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rosa-100">
                  <Icono size={18} strokeWidth={1.5} className="text-tinta-800" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="texto--1 text-tinta-500">{label}</dt>
                  <dd className="texto-0 font-medium capitalize text-tinta-900">{valor}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-7 border-t border-tinta-900/10 pt-6">
            <h3 className="mb-4 flex items-center gap-2 texto-1 text-tinta-900">
              <CreditCard size={17} strokeWidth={1.5} className="text-rosa-500" aria-hidden="true" />
              Resumen de pago
            </h3>
            <dl className="space-y-2.5 texto--1">
              <div className="flex justify-between gap-4">
                <dt className="text-tinta-600">Abonado ahora</dt>
                <dd className="font-medium text-tinta-900">{formatPrice(booking.deposit_amount)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-tinta-600">Saldo a pagar en el local</dt>
                <dd className="font-medium text-tinta-900">
                  {saldo > 0 ? formatPrice(saldo) : 'Sin saldo pendiente'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-7 rounded-2xl bg-crema-200/60 p-5">
            <h3 className="mb-3 texto-0 font-medium text-tinta-900">Antes de tu cita</h3>
            <ul className="space-y-2 texto--1 text-tinta-600">
              {[
                'Llega 5 minutos antes para acomodarte con calma.',
                'Si es depilación láser, ven con la zona rasurada y sin exposición solar reciente.',
                'Para tratamientos faciales, preferentemente sin maquillaje.',
                'Si necesitas reagendar, escríbenos por WhatsApp con 24 horas de anticipación.',
              ].map((linea) => (
                <li key={linea} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-rosa-400"
                  />
                  {linea}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-2 texto--1 text-tinta-500">
              <MapPin size={14} strokeWidth={1.5} className="text-rosa-500" aria-hidden="true" />
              Santiago, Chile
            </p>
          </div>
        </div>

        <Acciones />
      </Container>
    </div>
  );
}
