import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import PanelApp from './PanelApp';
import BarreraErrores from './BarreraErrores';
import { escucharInstalacion } from './instalacion';

/*
 * Entrada propia del panel. Vive en su propio HTML y su propio bundle: el
 * sitio público no carga nada de esto, ni sabe en qué ruta está.
 */
escucharInstalacion();

/*
 * El service worker del panel es el que recibe los avisos push. Se registra
 * con alcance solo en la ruta del panel: el sitio público tiene el suyo.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${__RUTA_PANEL__}/sw.js`, { scope: `${__RUTA_PANEL__}/` }).catch(() => {
      /* sin service worker el panel funciona; solo no hay avisos */
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BarreraErrores>
      <PanelApp />
    </BarreraErrores>
  </StrictMode>
);
