import { Check } from 'lucide-react';

const PASOS = [
  { num: 1, label: 'Tratamiento' },
  { num: 2, label: 'Fecha y hora' },
  { num: 3, label: 'Tus datos' },
];

/**
 * El indicador anterior ponía la etiqueta al lado de cada círculo más un
 * separador de ancho fijo, así que en móvil se desbordaba. Acá la etiqueta va
 * debajo y los separadores son flexibles.
 */
export default function StepIndicator({ actual }: { actual: number }) {
  return (
    <ol className="flex items-start justify-center" aria-label="Progreso de la reserva">
      {PASOS.map((paso, i) => {
        const completado = actual > paso.num;
        const activo = actual === paso.num;

        return (
          <li key={paso.num} className="flex flex-1 items-start last:flex-none">
            <div className="flex w-16 flex-col items-center gap-2 sm:w-24">
              <span
                aria-current={activo ? 'step' : undefined}
                className={`flex h-9 w-9 items-center justify-center border texto--1 transition-all duration-300 ease-out ${
                  completado
                    ? 'border-tinta-900 bg-dorado-400 text-tinta-900'
                    : activo
                      ? 'border-tinta-900 text-crema-100'
                      : 'border-dorado-400/35 text-crema-100/40'
                }`}
              >
                {completado ? <Check size={15} strokeWidth={2} aria-hidden="true" /> : paso.num}
              </span>
              <span
                className={`text-center texto--1 leading-tight transition-colors duration-300 ${
                  activo ? 'font-medium text-crema-100' : 'text-nacar-300'
                }`}
              >
                {paso.label}
              </span>
            </div>

            {i < PASOS.length - 1 && (
              <span
                aria-hidden="true"
                className={`mt-4 h-px flex-1 transition-colors duration-500 ${
                  completado ? 'bg-tinta-900' : 'bg-dorado-400/30'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
