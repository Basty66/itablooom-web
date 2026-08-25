import { useEffect } from 'react';
import { Check, Wallet, CreditCard, Timer, Info } from 'lucide-react';
import type { Service } from '../../types';
import { formatPrice, formatPriceRange } from '../../lib/format';
import type { DatosCliente } from './DetailsStep';

interface Props {
  datos: DatosCliente;
  onCambio: (datos: DatosCliente) => void;
  service: Service | null;
}

/**
 * Elección entre abonar o pagar todo online.
 *
 * Vivía al final del paso de datos, después de cinco campos: en móvil la
 * clienta llegaba a la decisión de pago con el formulario ya lleno y sin
 * verla venir. Acá tiene su propio paso, que además es donde se explica qué
 * queda pendiente en cada caso.
 */
export default function PagoStep({ datos, onCambio, service }: Props) {
  /*
   * Todo lo que sigue se calcula con `service` opcional y el corte por falta de
   * servicio va más abajo, después del efecto.
   *
   * El motivo es la regla de los hooks: si el `return null` fuera antes, este
   * componente tendría cero hooks mientras no hay servicio y uno en cuanto lo
   * hay. Al elegir servicio con la sección de pago ya abierta, React vería
   * cambiar el número de hooks entre dos renders y reventaría el paso entero.
   */
  const total = Number(service?.price) || 0;
  const abono = Number(service?.deposit_amount) || 0;
  const saldo = Math.max(total - abono, 0);

  /*
   * Hay servicios cuyo valor se define en el sillón: en uñas depende del largo
   * y del diseño, y por eso vienen con un rango.
   *
   * Ahí "pagar todo ahora" no puede ofrecerse. El único número que el sistema
   * conoce es el piso del rango, así que cobraría lo mínimo y la clienta se
   * iría creyendo que no debe nada; el resto aparecería recién al terminar,
   * que es exactamente la sorpresa que este flujo existe para evitar.
   */
  const valorAbierto = Boolean(service?.price_max && Number(service.price_max) > total);

  // Si venía eligiendo pago total y cambia a un servicio de valor abierto, se
  // vuelve al abono: si no, quedaría marcada una opción que ya no se muestra.
  useEffect(() => {
    if (valorAbierto && datos.paymentType === 'full') {
      onCambio({ ...datos, paymentType: 'deposit' });
    }
  }, [valorAbierto, datos, onCambio]);

  if (!service) return null;

  const opciones = [
    {
      tipo: 'deposit' as const,
      icono: Wallet,
      titulo: 'Reservar con abono',
      monto: abono,
      detalle: valorAbierto
        ? 'Pagas el resto en el local, según el largo y el diseño que elijas.'
        : saldo > 0
          ? `Pagas ${formatPrice(saldo)} en el local el día de tu cita.`
          : 'Confirmas tu hora al instante.',
      nota: valorAbierto ? null : 'Lo más elegido',
    },
    ...(valorAbierto
      ? []
      : [
          {
            tipo: 'full' as const,
            icono: CreditCard,
            titulo: 'Pagar todo ahora',
            monto: total,
            detalle: 'Llegas sin nada pendiente: el día de tu cita solo te relajas.',
            nota: null,
          },
        ]),
  ];

  return (
    <fieldset>
      <legend className="sr-only">¿Cómo prefieres pagar?</legend>

      {valorAbierto && (
        <p className="mb-4 flex items-start gap-2 rounded-[var(--radius-medio)] border border-cobre-400/25 bg-tinta-880 p-4 texto--1 leading-relaxed text-nacar-200/85">
          <Info size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-cobre-300" aria-hidden="true" />
          <span>
            Este servicio va de{' '}
            <strong className="font-medium text-crema-100">
              {formatPriceRange(service.price, service.price_max)}
            </strong>
            : el valor exacto depende del largo y del diseño, y se define contigo en el estudio. Por
            eso se reserva con abono y el resto se paga ahí.
          </span>
        </p>
      )}

      <div className={`grid gap-4 ${valorAbierto ? '' : 'sm:grid-cols-2'}`}>
        {opciones.map(({ tipo, icono: Icono, titulo, monto, detalle, nota }) => {
          const activo = datos.paymentType === tipo;
          return (
            <button
              key={tipo}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => onCambio({ ...datos, paymentType: tipo })}
              /*
               * El elegido se marca con borde y relleno rosa más una palomita.
               * Antes el estado activo usaba `border-tinta-900`, o sea el
               * color del propio fondo: el borde era invisible y no se
               * distinguía cuál de las dos opciones estaba seleccionada.
               */
              className={`relative rounded-2xl border p-5 text-left transition-all duration-300 ease-out ${
                activo
                  ? 'border-rosa-300 bg-rosa-300/10'
                  : 'border-crema-100/10 bg-tinta-880 hover:border-cobre-400/40 hover:bg-tinta-870'
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <Icono
                  size={20}
                  strokeWidth={1.4}
                  aria-hidden="true"
                  className={activo ? 'text-rosa-300' : 'text-cobre-400/70'}
                />
                {activo ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rosa-300">
                    <Check size={14} strokeWidth={2.5} className="text-vino-900" aria-hidden="true" />
                  </span>
                ) : (
                  nota && (
                    <span className="chip rounded-full px-2.5 py-0.5 texto--2 uppercase espaciado-medio">
                      {nota}
                    </span>
                  )
                )}
              </span>

              <span className="mt-4 block texto--2 uppercase espaciado-amplio text-nacar-300">
                {titulo}
              </span>
              <span
                className={`mt-1 block font-display texto-3 ${activo ? 'text-rosa-300' : 'text-cobre-400'}`}
              >
                {formatPrice(monto)}
              </span>
              <span className="mt-2 block texto--1 leading-relaxed text-nacar-200/80">{detalle}</span>
            </button>
          );
        })}
      </div>

      <p className="linea-cobre mt-6 flex items-start gap-2 border-t pt-5 texto--1 text-nacar-200/80">
        <Timer size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-cobre-300" aria-hidden="true" />
        Tu horario queda tomado por 10 minutos mientras completas el pago. Si no alcanzas, vuelve a
        elegirlo sin problema.
      </p>
    </fieldset>
  );
}
