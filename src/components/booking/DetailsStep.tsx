import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Mail, Phone, Timer, Check } from 'lucide-react';
import type { Service } from '../../types';
import { formatPrice } from '../../lib/format';

export interface DatosCliente {
  name: string;
  email: string;
  phone: string;
  rut: string;
  notes: string;
  paymentType: 'deposit' | 'full';
}

interface Props {
  datos: DatosCliente;
  onCambio: (datos: DatosCliente) => void;
  service: Service | null;
  fecha: Date | null;
  hora: string;
}

const INPUT =
  'w-full rounded-xl border border-tinta-900/15 bg-crema-50 px-4 py-3 texto-0 text-tinta-900 ' +
  'placeholder:text-tinta-400 transition-colors duration-200 hover:border-tinta-900/25 ' +
  'focus:border-rosa-400 focus:outline-none';

function Campo({
  label,
  icono,
  children,
}: {
  label: string;
  icono?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block texto--1 font-medium text-tinta-700">{label}</span>
      <span className="relative block">
        {icono && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tinta-400">
            {icono}
          </span>
        )}
        {children}
      </span>
    </label>
  );
}

export default function DetailsStep({ datos, onCambio, service, fecha, hora }: Props) {
  const set = (parcial: Partial<DatosCliente>) => onCambio({ ...datos, ...parcial });
  const monto = service
    ? datos.paymentType === 'full'
      ? service.price
      : service.deposit_amount
    : 0;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre completo *" icono={<User size={17} strokeWidth={1.5} />}>
          <input
            type="text"
            required
            autoComplete="name"
            value={datos.name}
            onChange={(e) => set({ name: e.target.value })}
            className={`${INPUT} pl-11`}
            placeholder="María González"
          />
        </Campo>

        <Campo label="Correo electrónico *" icono={<Mail size={17} strokeWidth={1.5} />}>
          <input
            type="email"
            required
            autoComplete="email"
            value={datos.email}
            onChange={(e) => set({ email: e.target.value })}
            className={`${INPUT} pl-11`}
            placeholder="maria@ejemplo.cl"
          />
        </Campo>

        <Campo label="Teléfono *" icono={<Phone size={17} strokeWidth={1.5} />}>
          <input
            type="tel"
            required
            autoComplete="tel"
            value={datos.phone}
            onChange={(e) => set({ phone: e.target.value })}
            className={`${INPUT} pl-11`}
            placeholder="+56 9 1234 5678"
          />
        </Campo>

        <Campo label="RUT (opcional)">
          <input
            type="text"
            value={datos.rut}
            onChange={(e) => set({ rut: e.target.value })}
            className={INPUT}
            placeholder="12.345.678-9"
          />
        </Campo>
      </div>

      <Campo label="Notas para tu especialista (opcional)">
        <textarea
          rows={3}
          value={datos.notes}
          onChange={(e) => set({ notes: e.target.value })}
          className={`${INPUT} resize-none`}
          placeholder="Alergias, tratamientos previos, condiciones médicas…"
        />
      </Campo>

      <fieldset>
        <legend className="mb-3 texto--1 font-medium text-tinta-700">¿Cómo quieres pagar?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { tipo: 'deposit' as const, titulo: 'Seña', detalle: 'El saldo lo pagas en el local', valor: service?.deposit_amount },
            { tipo: 'full' as const, titulo: 'Total', detalle: 'Llegas sin nada pendiente', valor: service?.price },
          ].map(({ tipo, titulo, detalle, valor }) => {
            const activo = datos.paymentType === tipo;
            return (
              <button
                key={tipo}
                type="button"
                role="radio"
                aria-checked={activo}
                onClick={() => set({ paymentType: tipo })}
                className={`rounded-2xl border p-5 text-left transition-all duration-200 ease-out active:scale-[0.99] ${
                  activo ? 'border-tinta-900 bg-rosa-100/60' : 'border-tinta-900/10 bg-crema-50 hover:border-rosa-300'
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className="texto-0 font-medium text-tinta-900">{titulo}</span>
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      activo ? 'bg-tinta-900 text-crema-100' : 'border border-tinta-900/20'
                    }`}
                  >
                    {activo && <Check size={11} strokeWidth={3} />}
                  </span>
                </span>
                <span className="mt-1 block texto--1 text-tinta-600">{detalle}</span>
                <span className="mt-2 block font-display texto-2 text-tinta-900">
                  {valor ? formatPrice(valor) : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {service && fecha && hora && (
        <div className="rounded-2xl border border-tinta-900/10 bg-crema-200/50 p-6">
          <h3 className="mb-4 texto-1 text-tinta-900">Resumen de tu cita</h3>
          <dl className="space-y-2.5 texto--1">
            {[
              ['Tratamiento', service.name],
              ['Fecha', format(fecha, "EEEE d 'de' MMMM", { locale: es })],
              ['Hora', hora],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-tinta-500">{k}</dt>
                <dd className="text-right font-medium capitalize text-tinta-900">{v}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 border-t border-tinta-900/10 pt-3">
              <dt className="text-tinta-600">Pagas ahora</dt>
              <dd className="font-display texto-2 text-tinta-900">{formatPrice(monto)}</dd>
            </div>
          </dl>

          {/* Expectativa explícita: el cupo se libera a los 10 min sin pago. */}
          <p className="mt-4 flex items-start gap-2 texto--1 text-tinta-500">
            <Timer size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-rosa-500" aria-hidden="true" />
            Tienes 10 minutos para completar el pago. Después el horario vuelve a quedar disponible.
          </p>
        </div>
      )}
    </div>
  );
}
