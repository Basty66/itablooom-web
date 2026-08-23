import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/*
 * Registro del service worker: es lo que permite instalar el sitio como app en
 * el teléfono. Va después del render para no competir con la primera pintura,
 * y si falla no se avisa: la web funciona igual sin él.
 */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* sin service worker el sitio sigue funcionando, solo no se instala */
    })
  })
}
