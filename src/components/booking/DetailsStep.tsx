import type { ReactNode } from 'react';
import { User, Mail, Phone, Timer } from 'lucide-react';
import type { Service } from '../../types';
import { formatPrice } from '../../lib/format';

export interface DatosCliente {
  name: string;
  email: string;
  phone: string;
  rut: string;
  notes: string;
}

interface Props {
  datos: DatosCliente;
  onCambio: (datos: DatosCliente) => void;
  service: Service | null;
  fecha: Date | null;
  hora: string;
}

const INPUT =
  'w-full border-0 border-b border-dorado-400/40 bg-transparent px-0 py-3 texto-0 text-tinta-900 ' +
  'placeholder:text-tinta-400 transition-colors duration-300 hover:border-dorado-500 ' +
  'focus:border-tinta-900 focus:outline-none focus:ring-0';

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
          <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-tinta-400">
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
            className={`${INPUT} pl-8`}
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
            className={`${INPUT} pl-8`}
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
            className={`${INPUT} pl-8`}
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

      {service && (
        <div className="rounded-2xl border border-tinta-900/10 bg-crema-50 p-4 sm:p-5">
          <span className="texto--1 font-medium text-tinta-700">Monto a pagar</span>
          <span className="mt-1 block font-display texto-2 sm:texto-3 text-tinta-900">
            {formatPrice(service.price)}
          </span>
        </div>
      )}

      {service && fecha && hora && (
        <p className="flex items-start gap-2 linea-oro border-t p-0 pt-5 texto--1 text-tinta-600">
          <Timer size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-dorado-700" aria-hidden="true" />
          Tienes 10 minutos para completar el pago. Después el horario vuelve a quedar disponible.
        </p>
      )}
    </div>
  );
}
