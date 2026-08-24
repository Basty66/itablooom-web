import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Invitación a seguir bajando. Es un botón real y no un adorno: hace scroll a
 * la sección destino y es alcanzable por teclado.
 *
 * Se desvanece apenas el usuario empieza a scrollear, porque una vez que ya
 * está bajando el indicador solo estorba.
 */
export default function ScrollIndicator({ destino }: { destino: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const alScrollear = () => setVisible(window.scrollY < 80);
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  function bajar() {
    const seccion = document.querySelector(destino);
    if (seccion) seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <button
      type="button"
      onClick={bajar}
      aria-label="Ver cómo reservar"
      /* Ahora el hero mide una pantalla en todos los tamaños, así que la
         invitación a bajar también corresponde en móvil. Solo se oculta si
         la altura es tan baja que el indicador se montaría sobre el texto. */
      className={`group absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-500 ease-out sm:bottom-8 [@media(min-height:600px)]:flex ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <span className="texto--2 uppercase espaciado-amplio text-nacar-300 transition-colors duration-200 group-hover:text-crema-100">
        Descubre más
      </span>
      <span className="linea-cobre flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ease-out group-hover:border-cobre-500 active:scale-90">
        {/* El rebote va en el icono y no en el botón, para que el área de
            click quede quieta y no se escape del cursor. */}
        <ChevronDown
          size={17}
          strokeWidth={1.5}
          aria-hidden="true"
          className="animate-bounce text-crema-100/90 motion-reduce:animate-none"
        />
      </span>
    </button>
  );
}
