import type { ReactNode } from 'react';
import { User, Mail, Phone, Check, ChevronDown } from 'lucide-react';
import { POLITICAS, TEXTO_ACEPTACION } from '../../lib/politicas';

export interface DatosCliente {
  name: string;
  email: string;
  phone: string;
  rut: string;
  notes: string;
  /** `deposit` reserva con el abono; `full` paga todo online. */
  paymentType: 'deposit' | 'full';
  /** Sin esto no se puede pagar: las políticas se aceptan antes de reservar. */
  aceptaTerminos: boolean;
}

interface Props {
  datos: DatosCliente;
  onCambio: (datos: DatosCliente) => void;
}

/*
 * Campo tonal con una sola línea de cobre abajo (utilidad `.campo`). Antes el
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

      <Campo label="¿Algo que debamos saber? (opcional)">
        <textarea
          rows={3}
          value={datos.notes}
          onChange={(e) => set({ notes: e.target.value })}
          className={`${INPUT} resize-none`}
          placeholder="Si vienes por uñas, cuéntanos el diseño que quieres o mándanos la foto de referencia por WhatsApp. También alergias o algo que debamos considerar."
        />
      </Campo>

      {/*
        Las políticas van desplegadas al alcance del dedo y no detrás de un
        enlace a otra página: sacar a la clienta del formulario a dos pasos del
        pago es perder la reserva. Van en un <details> nativo, que ya trae el
        comportamiento accesible y funciona aunque falle el JavaScript.
      */}
      <div className="linea-cobre rounded-[var(--radius-medio)] border bg-tinta-880 p-4 sm:p-5">
        <details className="group/pol">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 texto--1 font-medium uppercase espaciado-medio text-nacar-200/85 transition-colors duration-200 hover:text-crema-100">
            Políticas de reserva
            <ChevronDown
              size={15}
              strokeWidth={1.5}
              aria-hidden="true"
              className="shrink-0 text-cobre-300 transition-transform duration-300 group-open/pol:rotate-180"
            />
          </summary>

          <dl className="mt-4 space-y-3">
            {POLITICAS.map(({ titulo, detalle }) => (
              <div key={titulo}>
                <dt className="texto--1 font-medium text-crema-100">{titulo}</dt>
                <dd className="mt-0.5 texto--1 leading-relaxed text-nacar-200/80">{detalle}</dd>
              </div>
            ))}
          </dl>
        </details>

        {/*
          Casilla real y no un "al continuar aceptas": el consentimiento tiene
          que ser un acto, no una nota al pie. El cuadro dibujado va aparte del
          <input>, que queda invisible pero presente para el teclado y los
          lectores de pantalla.
        */}
        <label className="mt-5 flex cursor-pointer items-start gap-3">
          {/*
            Sin `required`: el input va oculto para los ojos pero presente para
            el teclado, y Chrome no sabe dónde poner el globo de error de un
            control que no puede enfocar —se queda mudo y bloquea el envío sin
            decir por qué. El bloqueo lo hace la barra de pago, que además lo
            explica en español y lleva hasta acá.
          */}
          <input
            type="checkbox"
            checked={datos.aceptaTerminos}
            onChange={(e) => set({ aceptaTerminos: e.target.checked })}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-all duration-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobre-300 ${
              datos.aceptaTerminos
                ? 'border-rosa-300 bg-rosa-300'
                : 'border-crema-100/25 bg-transparent'
            }`}
          >
            {datos.aceptaTerminos && (
              <Check size={13} strokeWidth={3} className="text-vino-900" aria-hidden="true" />
            )}
          </span>
          <span className="texto--1 leading-relaxed text-nacar-200/85">{TEXTO_ACEPTACION}</span>
        </label>
      </div>
    </div>
  );
}
