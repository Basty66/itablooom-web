import type { ReactNode } from 'react';
import { User, Mail, Phone } from 'lucide-react';

export interface DatosCliente {
  name: string;
  email: string;
  phone: string;
  rut: string;
  notes: string;
  /** `deposit` reserva con el abono; `full` paga todo online. */
  paymentType: 'deposit' | 'full';
}

interface Props {
  datos: DatosCliente;
  onCambio: (datos: DatosCliente) => void;
}

/*
 * Campo tonal con una sola línea de oro abajo (utilidad `.campo`). Antes el
 * foco aplicaba `border-tinta-900`, o sea el color del propio fondo: enfocar
 * hacía desaparecer la línea en vez de destacarla.
 */
const INPUT = 'campo w-full px-3 py-3 texto-0';

function Campo({
  label,
  icono,
  children,
}: {
  label: string;
  icono?: ReactNode;
  children: ReactNode;
}) {
  // group/campo + focus-within: la etiqueta pasa a blush cuando el campo toma
  // el foco, que es como el sistema marca el control activo.
  return (
    <label className="group/campo block">
      <span className="mb-2 block texto--1 font-medium uppercase espaciado-medio text-nacar-200/85 transition-colors duration-300 group-focus-within/campo:text-blush-100">
        {label}
      </span>
      {/* El desplazamiento del texto lo pone el contenedor, no la constante
          INPUT: así los campos sin icono no arrastran una sangría vacía. */}
      <span className={`relative block ${icono ? '[&>input]:pl-11' : ''}`}>
        {icono && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-nacar-300">
            {icono}
          </span>
        )}
        {children}
      </span>
    </label>
  );
}

export default function DetailsStep({ datos, onCambio }: Props) {
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

    </div>
  );
}
