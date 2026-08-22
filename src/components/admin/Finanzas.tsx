import { formatPrice } from '../../lib/format';

export interface DesglosePago {
  mercadopago: number | string;
  efectivo: number | string;
  transferencia: number | string;
  saldo_mp: number | string;
  no_shows: number | string;
}

/**
 * Cómo entró la plata del mes, por medio de pago.
 *
 * Es lo que permite cuadrar la caja al cerrar: cuánto hay que encontrar en
 * efectivo, cuánto debería estar en la cuenta bancaria y cuánto en Mercado
 * Pago. Sin este desglose el total del mes no se puede contrastar con nada.
 */
export default function Finanzas({
  datos,
  porCobrar,
  gastos = 0,
}: {
  datos: DesglosePago;
  porCobrar: number;
  gastos?: number;
}) {
  const n = (v: number | string) => Number(v) || 0;

  // Los abonos y los saldos cobrados por link entran por la misma vía.
  const viaMercadoPago = n(datos.mercadopago) + n(datos.saldo_mp);
  const efectivo = n(datos.efectivo);
  const transferencia = n(datos.transferencia);
  const total = viaMercadoPago + efectivo + transferencia;

  const filas = [
    { label: 'Mercado Pago', monto: viaMercadoPago, nota: 'abonos y links de saldo' },
    { label: 'Efectivo', monto: efectivo, nota: 'cobrado en el local' },
    { label: 'Transferencia', monto: transferencia, nota: 'cobrado en el local' },
  ];

  return (
    <section className="linea-oro mb-8 border-y py-5">
      <h2 className="mb-5 texto--1 uppercase espaciado-medio text-crema-100">
        Cómo entró la plata este mes
      </h2>

      <dl className="space-y-3">
        {filas.map(({ label, monto, nota }) => {
          const pct = total > 0 ? (monto / total) * 100 : 0;
          return (
            <div key={label}>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="texto--1 text-nacar-200/85">
                  {label}
                  <span className="ml-2 texto--2 text-nacar-300">{nota}</span>
                </dt>
                <dd className="texto-0 tabular-nums text-crema-100">{formatPrice(monto)}</dd>
              </div>
              {/* Barra proporcional: se lee de un vistazo sin leer los números. */}
              <div className="mt-1.5 h-px w-full bg-dorado-400/20">
                <div
                  className="h-px bg-dorado-500 transition-all duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </dl>

      <div className="linea-oro mt-5 flex items-baseline justify-between gap-3 border-t pt-4">
        <span className="texto--1 text-nacar-200/80">Total cobrado</span>
        <span className="texto-0 tabular-nums text-crema-100">{formatPrice(total)}</span>
      </div>

      {gastos > 0 && (
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <span className="texto--1 text-nacar-200/80">Gastos del mes</span>
          <span className="texto-0 tabular-nums text-nacar-200/80">− {formatPrice(gastos)}</span>
        </div>
      )}

      {/* Lo que queda: el número por el que se mide si el mes cerró bien. */}
      <div className="linea-oro mt-3 flex items-baseline justify-between gap-3 border-t pt-4">
        <span className="texto--1 uppercase espaciado-medio text-crema-100">Te queda</span>
        <span className="font-display texto-3 tabular-nums text-crema-100">
          {formatPrice(total - gastos)}
        </span>
      </div>

      {porCobrar > 0 && (
        <>
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <span className="texto--1 text-nacar-200/80">Falta cobrar en el local</span>
            <span className="texto-0 tabular-nums text-nacar-200/80">{formatPrice(porCobrar)}</span>
          </div>
          <div className="linea-oro mt-3 flex items-baseline justify-between gap-3 border-t pt-3">
            <span className="texto--1 text-nacar-300">
              Total agendado
              <span className="ml-2 texto--2 text-nacar-300">si todas pagan completo</span>
            </span>
            <span className="texto-0 tabular-nums text-nacar-300">
              {formatPrice(total + porCobrar)}
            </span>
          </div>
        </>
      )}

      {n(datos.no_shows) > 0 && (
        <p className="mt-1.5 texto--1 text-nacar-300">
          {n(datos.no_shows)} {n(datos.no_shows) === 1 ? 'clienta no asistió' : 'clientas no asistieron'} este
          mes; su abono quedó como ingreso.
        </p>
      )}
    </section>
  );
}
