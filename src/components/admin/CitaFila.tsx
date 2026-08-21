import { useState } from 'react';
import { MessageCircle, Link2, Check, UserX, Loader2, Copy } from 'lucide-react';
import type { Booking } from '../../types';
import { formatPrice } from '../../lib/format';
import {
  saldoPendiente,
  registrarPagoSaldo,
  marcarNoShow,
  generarLinkSaldo,
  type MetodoPagoSaldo,
} from '../../lib/api';

const ESTADOS: Record<string, { clase: string; label: string }> = {
  confirmed: { clase: 'bg-emerald-100 text-emerald-900', label: 'Confirmada' },
  pending: { clase: 'bg-amber-100 text-amber-900', label: 'Pendiente' },
  cancelled: { clase: 'bg-tinta-900/8 text-tinta-600', label: 'Cancelada' },
  completed: { clase: 'bg-dorado-200 text-tinta-900', label: 'Completada' },
  no_show: { clase: 'bg-tinta-900 text-crema-100', label: 'No asistió' },
};

interface Props {
  booking: Booking;
  onRecordatorio: (b: Booking) => void;
  onCambio: () => void;
}

/**
 * Una cita en la agenda del día, con sus acciones de cobro.
 *
 * El saldo se calcula (total − abono) en vez de leerse de una columna: así no
 * se desincroniza si cambia el precio del servicio después de la reserva.
 */
export default function CitaFila({ booking: b, onRecordatorio, onCambio }: Props) {
  const [ocupado, setOcupado] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const estado = ESTADOS[b.status] ?? ESTADOS.pending;
  const saldo = saldoPendiente(b);
  const debeSaldo = b.deposit_paid && !b.remaining_paid && saldo > 0;
  const puedeNoShow = b.status === 'confirmed';

  async function cobrar(metodo: MetodoPagoSaldo) {
    setOcupado(metodo);
    setError('');
    const r = await registrarPagoSaldo(b.id, metodo);
    if (!r.ok) setError(r.error || 'No se pudo registrar');
    setOcupado('');
    if (r.ok) onCambio();
  }

  async function pedirLink() {
    setOcupado('link');
    setError('');
    const r = await generarLinkSaldo(b.id);
    if (r.ok && r.init_point) {
      setLink(r.init_point);
      // Copiar directo evita el paso de seleccionar el texto a mano.
      try {
        await navigator.clipboard.writeText(r.init_point);
      } catch {
        /* si el navegador lo bloquea, el link queda visible abajo */
      }
    } else {
      setError(r.error || 'No se pudo generar el link');
    }
    setOcupado('');
  }

  async function noShow() {
    if (!confirm(`¿Marcar que ${b.client_name} no asistió? El abono queda como ingreso.`)) return;
    setOcupado('noshow');
    const r = await marcarNoShow(b.id);
    if (!r.ok) setError(r.error || 'No se pudo marcar');
    setOcupado('');
    if (r.ok) onCambio();
  }

  const BOTON =
    'inline-flex items-center gap-1.5 border px-3 py-1.5 texto--2 uppercase espaciado-medio ' +
    'transition-all duration-300 active:scale-95 disabled:opacity-40';

  return (
    <li className="px-5 py-4">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-crema-200 texto--1 font-medium tabular-nums text-tinta-900">
          {b.booking_time ? String(b.booking_time).slice(0, 5) : '—'}
        </span>

        <div className="min-w-0 flex-1">
          <p className="texto-0 font-medium text-tinta-900">{b.client_name}</p>
          <p className="texto--1 text-tinta-600">{b.service_name || 'Servicio'}</p>
          <p className="texto--1 text-tinta-500">{b.client_phone}</p>
        </div>

        <div className="shrink-0 text-right">
          <span className={`inline-block px-3 py-1 texto--2 uppercase espaciado-medio ${estado.clase}`}>
            {estado.label}
          </span>
          <p className="mt-1.5 texto--1 text-tinta-900">
            {formatPrice(Number(b.total_amount || 0))}
          </p>
          {debeSaldo ? (
            <p className="texto--1 text-dorado-700">Debe {formatPrice(saldo)}</p>
          ) : b.remaining_paid ? (
            <p className="texto--1 text-tinta-500">Pagado completo</p>
          ) : null}
        </div>
      </div>

      {/* Acciones: solo las que aplican al estado de esta cita. */}
      {(debeSaldo || puedeNoShow) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-16">
          {b.status === 'confirmed' && (
            <button onClick={() => onRecordatorio(b)} className={`${BOTON} linea-oro text-tinta-700 hover:border-tinta-900`}>
              <MessageCircle size={13} strokeWidth={1.5} aria-hidden="true" />
              Recordar
            </button>
          )}

          {debeSaldo && (
            <>
              <button onClick={pedirLink} disabled={!!ocupado} className={`${BOTON} linea-oro text-tinta-700 hover:border-tinta-900`}>
                {ocupado === 'link' ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} strokeWidth={1.5} />}
                Link de pago
              </button>
              <button onClick={() => cobrar('cash')} disabled={!!ocupado} className={`${BOTON} linea-oro text-tinta-700 hover:border-tinta-900`}>
                {ocupado === 'cash' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={1.5} />}
                Cobré efectivo
              </button>
              <button onClick={() => cobrar('transfer')} disabled={!!ocupado} className={`${BOTON} linea-oro text-tinta-700 hover:border-tinta-900`}>
                {ocupado === 'transfer' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={1.5} />}
                Cobré transferencia
              </button>
            </>
          )}

          {puedeNoShow && (
            <button onClick={noShow} disabled={!!ocupado} className={`${BOTON} border-tinta-900/20 text-tinta-500 hover:border-tinta-900 hover:text-tinta-900`}>
              {ocupado === 'noshow' ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} strokeWidth={1.5} />}
              No asistió
            </button>
          )}
        </div>
      )}

      {link && (
        <div className="anim-entrada linea-oro ml-16 mt-3 flex items-center gap-2 border p-3">
          <Copy size={13} strokeWidth={1.5} className="shrink-0 text-dorado-700" aria-hidden="true" />
          <span className="texto--1 text-tinta-600">Link copiado — envíaselo por WhatsApp:</span>
          <a href={link} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate texto--1 text-tinta-900 underline">
            {link}
          </a>
        </div>
      )}

      {error && (
        <p role="alert" className="ml-16 mt-2 texto--1 text-tinta-800">
          {error}
        </p>
      )}
    </li>
  );
}
