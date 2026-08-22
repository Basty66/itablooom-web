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

/*
 * Píldoras tonales: relleno del color al 15% y letra clara del mismo matiz,
 * en vez de los verdes y ámbar planos de antes. Sobre el fondo oscuro esos
 * rellenos claros funcionaban como manchas y competían entre sí; así el
 * estado se distingue por matiz pero todos pesan igual.
 */
const ESTADOS: Record<string, { clase: string; label: string }> = {
  confirmed: { clase: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30', label: 'Confirmada' },
  pending: { clase: 'bg-amber-400/15 text-amber-300 border-amber-400/30', label: 'Pendiente' },
  cancelled: { clase: 'bg-crema-100/8 text-nacar-300 border-crema-100/15', label: 'Cancelada' },
  completed: { clase: 'bg-dorado-400/18 text-dorado-300 border-dorado-400/35', label: 'Completada' },
  no_show: { clase: 'bg-rosa-500/20 text-rosa-300 border-rosa-400/35', label: 'No asistió' },
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
        <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-tinta-850 texto--1 font-medium tabular-nums text-crema-100">
          {b.booking_time ? String(b.booking_time).slice(0, 5) : '—'}
        </span>

        <div className="min-w-0 flex-1">
          <p className="texto-0 font-medium text-crema-100">{b.client_name}</p>
          <p className="texto--1 text-nacar-200/80">{b.service_name || 'Servicio'}</p>
          <p className="texto--1 text-nacar-300">{b.client_phone}</p>
        </div>

        <div className="shrink-0 text-right">
          <span className={`inline-block rounded-full border px-3 py-1 texto--2 uppercase espaciado-medio ${estado.clase}`}>
            {estado.label}
          </span>
          <p className="mt-1.5 texto--1 text-crema-100">
            {formatPrice(Number(b.total_amount || 0))}
          </p>
          {debeSaldo ? (
            <p className="texto--1 text-dorado-300">Debe {formatPrice(saldo)}</p>
          ) : b.remaining_paid ? (
            <p className="texto--1 text-nacar-300">Pagado completo</p>
          ) : null}
        </div>
      </div>

      {/* Acciones: solo las que aplican al estado de esta cita. */}
      {(debeSaldo || puedeNoShow) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-16">
          {b.status === 'confirmed' && (
            <button onClick={() => onRecordatorio(b)} className={`${BOTON} linea-oro text-nacar-200/85 hover:border-dorado-400`}>
              <MessageCircle size={13} strokeWidth={1.5} aria-hidden="true" />
              Recordar
            </button>
          )}

          {debeSaldo && (
            <>
              <button onClick={pedirLink} disabled={!!ocupado} className={`${BOTON} linea-oro text-nacar-200/85 hover:border-dorado-400`}>
                {ocupado === 'link' ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} strokeWidth={1.5} />}
                Link de pago
              </button>
              <button onClick={() => cobrar('cash')} disabled={!!ocupado} className={`${BOTON} linea-oro text-nacar-200/85 hover:border-dorado-400`}>
                {ocupado === 'cash' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={1.5} />}
                Cobré efectivo
              </button>
              <button onClick={() => cobrar('transfer')} disabled={!!ocupado} className={`${BOTON} linea-oro text-nacar-200/85 hover:border-dorado-400`}>
                {ocupado === 'transfer' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={1.5} />}
                Cobré transferencia
              </button>
            </>
          )}

          {puedeNoShow && (
            <button onClick={noShow} disabled={!!ocupado} className={`${BOTON} border-crema-100/20 text-nacar-300 hover:border-dorado-400 hover:text-crema-100`}>
              {ocupado === 'noshow' ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} strokeWidth={1.5} />}
              No asistió
            </button>
          )}
        </div>
      )}

      {link && (
        <div className="anim-entrada linea-oro ml-16 mt-3 flex items-center gap-2 border p-3">
          <Copy size={13} strokeWidth={1.5} className="shrink-0 text-dorado-300" aria-hidden="true" />
          <span className="texto--1 text-nacar-200/80">Link copiado — envíaselo por WhatsApp:</span>
          <a href={link} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate texto--1 text-crema-100 underline">
            {link}
          </a>
        </div>
      )}

      {error && (
        <p role="alert" className="ml-16 mt-2 texto--1 text-nacar-100">
          {error}
        </p>
      )}
    </li>
  );
}
