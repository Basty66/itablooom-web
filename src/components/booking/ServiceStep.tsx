import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Service } from '../../types';
import { formatPriceRange, formatDurationRange } from '../../lib/format';
import { Skeleton } from '../ui/Skeleton';
import { etiquetaCategoria } from '../ui/ServiceVisual';
import { CATEGORIAS_GODDESS } from '../../lib/categorias';
import { ICONOS_RUBRO } from '../../lib/iconos-rubro';
import SelectorSegmentado from '../ui/SelectorSegmentado';

interface Props {
  services: Service[];
  seleccionado: Service | null;
  onSeleccionar: (s: Service) => void;
  cargando: boolean;
}

/**
 * Elección de servicio como lista editorial.
 *
 * Antes eran tarjetas con borde, radio y miniatura chica: se leían como
 * botones de formulario. Acá cada servicio es una fila separada por línea
 * fina, con la foto en retrato y el precio alineado a la derecha, como una
 * carta. La fila elegida se marca con una barra de tinta al costado, no con
 * un relleno de color.
 */
export default function ServiceStep({ services, seleccionado, onSeleccionar, cargando }: Props) {
  /*
   * Rubro a la vista. Antes se listaban los trece servicios de corrido y en
   * el teléfono eso era casi tres pantallas para llegar a cejas. Arranca en
   * el rubro del servicio ya elegido —el que viene desde el catálogo— o en
   * el primero.
   */
  const [rubroElegido, setRubroElegido] = useState<string | null>(null);

  if (cargando) {
    return (
      <div className="divide-y divide-cobre-400/25 border-y border-cobre-400/25">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-5 py-5">
            <Skeleton className="h-24 w-20 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <p className="linea-cobre border-y py-10 text-center texto--1 text-nacar-200/80">
        No hay servicios disponibles en este momento.
      </p>
    );
  }

  /*
   * Agrupados por rubro. En lista corrida, con siete servicios mezclados, las
   * tres variantes de acrílicas quedaban separadas entre pestañas y cejas: no
   * se leía que fueran alternativas de lo mismo.
   */
  const porRubro = services.reduce<Record<string, Service[]>>((acc, s) => {
    const clave = etiquetaCategoria(s.category);
    (acc[clave] ||= []).push(s);
    return acc;
  }, {});

  /*
   * Orden del rubro —uñas, pestañas, cejas— y no el que devuelva la base, que
   * es el de creación de las filas y cambia sin aviso. Es el mismo orden que
   * anuncia el sitio en su encabezado.
   */
  const ordenRubros: string[] = CATEGORIAS_GODDESS.filter((c) => c.id !== 'all').map((c) => c.label);
  const gruposOrdenados = Object.entries(porRubro).sort(
    ([a], [b]) => ordenRubros.indexOf(a) - ordenRubros.indexOf(b)
  );

  let indice = -1;

  const rubroVisible =
    rubroElegido ?? (seleccionado ? etiquetaCategoria(seleccionado.category) : gruposOrdenados[0][0]);
  const idDeRubro = (label: string) => CATEGORIAS_GODDESS.find((c) => c.label === label)?.id ?? 'all';

  return (
    <div className="flex flex-col gap-5">
      {gruposOrdenados.length > 1 && (
        <SelectorSegmentado
          etiqueta="Rubro"
          className="self-start"
          activa={rubroVisible}
          onCambio={setRubroElegido}
          opciones={gruposOrdenados.map(([rubro, lista]) => ({
            id: rubro,
            label: rubro,
            total: lista.length,
            icono: ICONOS_RUBRO[idDeRubro(rubro)],
          }))}
        />
      )}

      <div role="radiogroup" aria-label="Servicios disponibles" className="flex flex-col gap-7">
        {gruposOrdenados
          .filter(([rubro]) => rubro === rubroVisible)
          .map(([rubro, lista]) => (
          <div key={rubro}>
            <div className="divide-y divide-cobre-400/25 border-y border-cobre-400/25">
        {lista.map((service) => {
          const activo = seleccionado?.id === service.id;
          const i = ++indice;

          return (
            <button
              key={service.id}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => onSeleccionar(service)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`anim-entrada group relative flex w-full items-center gap-4 py-5 pl-4 pr-1 text-left transition-colors duration-300 sm:gap-5 ${
                activo ? 'bg-rosa-300/8' : 'hover:bg-tinta-850'
              }`}
            >
              {/*
                Barra de selección al canto. Era `bg-tinta-900`, es decir el
                color del propio fondo: marcaba la fila con una barra invisible
                y no había forma de saber cuál estaba elegida.
              */}
              <span
                aria-hidden="true"
                className={`absolute left-0 top-0 h-full w-0.5 transition-opacity duration-300 bg-gradient-to-b from-cobre-100 via-cobre-300 to-cobre-500 ${
                  activo ? 'opacity-100' : 'opacity-0'
                }`}
              />

              <span className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-medio)] bg-tinta-850 sm:h-28 sm:w-28">
                {service.image_url && (
                  <img
                    src={service.image_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                  />
                )}
              </span>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-display texto-1 leading-tight text-crema-100">
                  {service.name}
                </span>

                <span className="mt-1 texto--1 text-nacar-300">
                  {formatDurationRange(service.duration_minutes, service.duration_max_minutes)}
                </span>

                {/*
                  En el teléfono el precio va acá, bajo la duración. En su
                  columna de la derecha, un rango como "$25.000 – $35.000" no
                  se encogía y dejaba al nombre y la duración en una tira de
                  50px, partidos palabra por palabra.
                */}
                <span className="texto-metal mt-1.5 w-fit whitespace-nowrap font-display texto-1 tabular-nums sm:hidden">
                  {formatPriceRange(service.price, service.price_max)}
                </span>
              </span>

              {/* En el teléfono, un círculo de selección en vez de la palabra:
                  es el indicador que se espera de una lista de opciones y deja
                  el ancho para el precio. */}
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 sm:hidden ${
                  activo ? 'boton-metal border-transparent text-vino-900' : 'border-cobre-400/50'
                }`}
              >
                {activo && <Check size={13} strokeWidth={2.5} />}
              </span>

              <span className="hidden shrink-0 flex-col items-end gap-1.5 pl-2 text-right sm:flex">
                <span className="texto-metal hidden font-display texto-1 tabular-nums sm:block">
                  {formatPriceRange(service.price, service.price_max)}
                </span>
                {/* Palomita para el elegido: en una lista de siete filas, la
                    barra de 2px al canto se pierde de vista. */}
                {activo ? (
                  <span className="flex items-center gap-1.5 texto--2 uppercase espaciado-medio text-cobre-200">
                    <Check size={13} strokeWidth={2.5} aria-hidden="true" />
                    Elegido
                  </span>
                ) : (
                  <span className="texto--2 uppercase espaciado-medio text-nacar-300 transition-colors duration-300 group-hover:text-crema-100">
                    Elegir
                  </span>
                )}
              </span>
            </button>
          );
        })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
