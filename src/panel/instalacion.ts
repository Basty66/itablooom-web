/**
 * Aviso de instalación de Chrome y Android.
 *
 * El navegador dispara `beforeinstallprompt` una sola vez y muy temprano,
 * antes de que Ajustes exista: si nadie lo guarda, el botón "Instalar app"
 * no tiene con qué abrir el diálogo. Se captura al arrancar y se avisa a
 * quien esté escuchando. En iPhone no existe: allá se instala a mano desde
 * Compartir.
 */
export interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let guardado: EventoInstalar | null = null;
const oyentes = new Set<(e: EventoInstalar | null) => void>();

export function escucharInstalacion() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    guardado = e as EventoInstalar;
    oyentes.forEach((f) => f(guardado));
  });
  window.addEventListener('appinstalled', () => {
    guardado = null;
    oyentes.forEach((f) => f(null));
  });
}

export function alCambiarInstalacion(f: (e: EventoInstalar | null) => void): () => void {
  oyentes.add(f);
  f(guardado);
  return () => oyentes.delete(f);
}
