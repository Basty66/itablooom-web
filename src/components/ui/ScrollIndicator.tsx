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
      /* Mismas condiciones que el hero a pantalla completa: sin altura
         suficiente el indicador se montaría sobre el texto. */
      className={`group absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-500 ease-out lg:[@media(min-height:720px)]:flex ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <span className="texto--2 uppercase espaciado-amplio text-tinta-500 transition-colors duration-200 group-hover:text-tinta-900">
        Descubre más
      </span>
      <span className="linea-oro flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ease-out group-hover:border-dorado-500 active:scale-90">
        {/* El rebote va en el icono y no en el botón, para que el área de
            click quede quieta y no se escape del cursor. */}
        <ChevronDown
          size={17}
          strokeWidth={1.5}
          aria-hidden="true"
          className="animate-bounce text-tinta-800 motion-reduce:animate-none"
        />
      </span>
    </button>
  );
}
