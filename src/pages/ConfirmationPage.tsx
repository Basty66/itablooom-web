import { useLocation, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, CreditCard, MessageCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect, useCallback } from 'react';
import type { Booking } from '../types';
import { getBookingById, checkPaymentStatus } from '../lib/api';

export default function ConfirmationPage() {
  const [searchParams] = useSearchParams();
  const state = useLocation().state as any;

  const [booking, setBooking] = useState<Booking | null>(state?.booking || null);
  const [loading, setLoading] = useState(!state?.booking);

  const status = searchParams.get('status');
  const bookingId = searchParams.get('booking');

  const loadBooking = useCallback(async (id: string) => {
    try {
      const data = await getBookingById(id);
      if (data) {
        setBooking(data);
        // Si el pago fue aprobado pero la reserva no está confirmada, sincronizar
        if (status === 'approved' && !data.deposit_paid) {
          await checkPaymentStatus(id);
          const updated = await getBookingById(id);
          if (updated) setBooking(updated);
        }
      }
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (bookingId && !booking) {
      loadBooking(bookingId);
    } else if (!bookingId && !booking) {
      // Sin booking ID — Mercado Pago no pasó el parámetro
      // Mostrar mensaje de éxito genérico
      setLoading(false);
    }
  }, [bookingId, booking, loadBooking]);

  function formatPrice(price: number) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin rounded-full h-12 w-12 text-purple-700" />
      </div>
    );
  }

  if (status === 'failure') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pago No Completado</h1>
          <p className="text-gray-600 mb-6">
            El pago no fue procesado. Puedes intentar nuevamente.
          </p>
          <Link
            to="/agendar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
          >
            <ArrowLeft size={18} />
            Intentar Nuevamente
          </Link>
        </div>
      </div>
    );
  }

  // Si hay booking, mostrar detalles
  if (booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Cita Confirmada!</h1>
            <p className="text-gray-600">
              Hemos enviado los detalles a tu correo electrónico
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Detalles de tu Reserva</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-purple-700" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-semibold text-gray-900">
                    {booking.booking_date ? format(new Date(booking.booking_date), "EEEE d 'de' MMMM, yyyy", { locale: es }) : 'Por confirmar'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-purple-700" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hora</p>
                  <p className="font-semibold text-gray-900">{booking.booking_time}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="text-purple-700" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Servicio</p>
                  <p className="font-semibold text-gray-900">{booking.service_name || 'Servicio'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">Resumen de Pago</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Seña abonada</span>
                  <span className="font-semibold text-green-600">{formatPrice(booking.deposit_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saldo a pagar en el local</span>
                  <span className="font-semibold text-gray-900">{formatPrice(booking.total_amount - booking.deposit_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Próximos Pasos</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>✅ Recibirás un correo de confirmación con todos los detalles</p>
              <p>✅ Te enviaremos un recordatorio por WhatsApp 24 horas antes</p>
              <p>✅ El saldo restante se paga en el local el día de tu cita</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={18} />
              Volver al Inicio
            </Link>
            <a
              href="https://wa.me/56900000000?text=Hola!%20Acabo%20de%20agendar%20una%20cita"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <MessageCircle size={18} />
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Sin booking — pago aprobado pero no hay ID de reserva
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-600" size={48} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Pago Aprobado!</h1>
        <p className="text-gray-600 mb-6">
          Tu pago fue procesado exitosamente. Recibirás un correo con los detalles de tu reserva.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
            Volver al Inicio
          </Link>
          <a
            href="https://wa.me/56900000000?text=Hola!%20Acabo%20de%20agendar%20una%20cita"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <MessageCircle size={18} />
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
