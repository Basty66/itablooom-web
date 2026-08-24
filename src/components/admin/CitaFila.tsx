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
  completed: { clase: 'bg-cobre-400/18 text-cobre-300 border-cobre-400/35', label: 'Completada' },
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
    'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-suave)] border px-3 py-2.5 texto--2 uppercase espaciado-medio ' +
    'transition-all duration-300 active:scale-95 disabled:opacity-40 sm:justify-start sm:py-1.5';

  return (
    <li className="px-4 py-4 sm:px-5">
      {/*
        En móvil la fila se apila. Con las tres columnas horizontales, el
        nombre quedaba en 109px de ancho y se partía en cinco líneas: cada
        cita ocupaba 400px, media pantalla. Desde sm vuelve a la fila, que
        ahí sí entra.
      */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        {/* Cabecera: la hora y el estado, que es lo que se escanea. */}
        <div className="flex items-center justify-between gap-3 sm:block sm:justify-start">
          <span className="flex h-11 shrink-0 items-center justify-center rounded-[var(--radius-suave)] bg-tinta-850 px-3 texto-0 font-medium tabular-nums text-crema-100 sm:h-12 sm:w-12 sm:px-0">
            {b.booking_time ? String(b.booking_time).slice(0, 5) : '—'}
          </span>
          <span
            className={`shrink-0 rounded-full border px-3 py-1 texto--2 uppercase espaciado-medio sm:hidden ${estado.clase}`}
          >
            {estado.label}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="texto-0 font-medium text-crema-100">{b.client_name}</p>
          <p className="texto--1 text-nacar-200/80">{b.service_name || 'Servicio'}</p>
          <a
            href={`tel:${(b.client_phone || '').replace(/[^0-9+]/g, '')}`}
            className="inline-block py-1 texto--1 text-nacar-300 transition-colors hover:text-crema-100"
          >
            {b.client_phone}
          </a>
        </div>

        {/* Montos: en móvil van en una línea al pie, no en columna. */}
        <div className="flex items-baseline justify-between gap-3 sm:block sm:shrink-0 sm:text-right">
          <span
            className={`hidden rounded-full border px-3 py-1 texto--2 uppercase espaciado-medio sm:inline-block ${estado.clase}`}
          >
            {estado.label}
          </span>
          <p className="texto-0 text-crema-100 sm:mt-1.5 sm:texto--1">
            {formatPrice(Number(b.total_amount || 0))}
          </p>
          {debeSaldo ? (
            <p className="texto--1 font-medium text-cobre-300">Debe {formatPrice(saldo)}</p>
          ) : b.remaining_paid ? (
            <p className="texto--1 text-nacar-300">Pagado completo</p>
          ) : null}
        </div>
      </div>

      {/* Acciones: solo las que aplican al estado de esta cita. */}
      {(debeSaldo || puedeNoShow) && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:pl-16">
          {b.status === 'confirmed' && (
            <button onClick={() => onRecordatorio(b)} className={`${BOTON} linea-cobre text-nacar-200/85 hover:border-cobre-400`}>
              <MessageCircle size={13} strokeWidth={1.5} aria-hidden="true" />
              Recordar
            </button>
          )}

          {debeSaldo && (
            <>
              <button onClick={pedirLink} disabled={!!ocupado} className={`${BOTON} linea-cobre text-nacar-200/85 hover:border-cobre-400`}>
                {ocupado === 'link' ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} strokeWidth={1.5} />}
                Link de pago
              </button>
              <button onClick={() => cobrar('cash')} disabled={!!ocupado} className={`${BOTON} linea-cobre text-nacar-200/85 hover:border-cobre-400`}>
                {ocupado === 'cash' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={1.5} />}
                Cobré efectivo
              </button>
              <button onClick={() => cobrar('transfer')} disabled={!!ocupado} className={`${BOTON} linea-cobre text-nacar-200/85 hover:border-cobre-400`}>
                {ocupado === 'transfer' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={1.5} />}
                Cobré transferencia
              </button>
            </>
          )}

          {puedeNoShow && (
            <button onClick={noShow} disabled={!!ocupado} className={`${BOTON} border-crema-100/20 text-nacar-300 hover:border-cobre-400 hover:text-crema-100`}>
              {ocupado === 'noshow' ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} strokeWidth={1.5} />}
              No asistió
            </button>
          )}
        </div>
      )}

      {link && (
        <div className="anim-entrada linea-cobre mt-3 flex flex-wrap items-center gap-2 rounded-[var(--radius-suave)] border p-3 sm:ml-16">
          <Copy size={13} strokeWidth={1.5} className="shrink-0 text-cobre-300" aria-hidden="true" />
          <span className="texto--1 text-nacar-200/80">Link copiado — envíaselo por WhatsApp:</span>
          <a href={link} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate texto--1 text-crema-100 underline">
            {link}
          </a>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 texto--1 text-nacar-100 sm:ml-16">
          {error}
        </p>
      )}
    </li>
  );
}
