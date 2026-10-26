import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/** La instancia activa, para los saltos que se piden desde el código. */
let lenis: Lenis | null = null;

/**
 * Desplazamiento con inercia (Lenis) para el sitio público.
 *
 * La rueda y el trackpad dejan de avanzar a saltos de cien píxeles: la
 * página se desliza y se asienta. El `lerp` bajo es lo que la hace sentir
 * lenta y pesada como una revista, y no apurada; más bajo empieza a sentirse
 * como que el scroll llega tarde.
 *
 * En pantallas táctiles queda el desplazamiento nativo: en un iPhone el
 * scroll del sistema ya es el más fluido posible y uno simulado lo empeora.
 * Con "reducir movimiento" no se activa, y el panel tampoco lo usa: tiene
 * listas con su propio scroll.
 */
export function useScrollSuave(activo: boolean) {
  useEffect(() => {
    if (!activo) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const instancia = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      // Zonas con scroll propio usan el nativo.
      prevent: (nodo) => Boolean((nodo as HTMLElement).closest?.('[data-lenis-prevent], textarea, select')),
    });
    lenis = instancia;

    // Si el menú del teléfono bloquea el fondo (overflow hidden), se detiene.
    const vigia = new MutationObserver(() => {
      if (document.body.style.overflow === 'hidden') instancia.stop();
      else instancia.start();
    });
    vigia.observe(document.body, { attributes: true, attributeFilter: ['style'] });

    return () => {
      vigia.disconnect();
      instancia.destroy();
      if (lenis === instancia) lenis = null;
    };
  }, [activo]);
}

/**
 * Lleva la página a una altura. Con Lenis activo usa su propia animación;
 * sin él, la del navegador. Pedirle `scrollTo` nativo con Lenis andando
 * hacía que los dos pelearan por la posición y la página tiritaba.
 */
export function desplazarA(destino: number, { inmediato = false } = {}) {
  if (lenis) {
    lenis.scrollTo(destino, { immediate: inmediato, force: true, duration: 1.2 });
    return;
  }
  window.scrollTo({ top: destino, behavior: inmediato ? 'auto' : 'smooth' });
}
