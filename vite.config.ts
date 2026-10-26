import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { RUTA_PANEL } from './api/_shared/ruta.js'

const ES_PANEL = new RegExp(`^${RUTA_PANEL}(/|$|\\?)`)

/**
 * En desarrollo, la ruta del panel y lo que cuelga de ella sirven el HTML del
 * panel, igual que hacen los rewrites de vercel.json en producción. Los
 * archivos (sw.js, el manifest, la insignia) pasan de largo.
 */
const reescribirPanel = (req: { url?: string }, _res: unknown, next: () => void) => {
  if (req.url && ES_PANEL.test(req.url) && !/\.[a-z0-9]+(\?|$)/i.test(req.url)) {
    req.url = `${RUTA_PANEL}.html`
  }
  next()
}

const rutasDelPanel = (): Plugin => ({
  name: 'rutas-del-panel',
  configureServer(servidor) {
    servidor.middlewares.use(reescribirPanel)
  },
  configurePreviewServer(servidor) {
    servidor.middlewares.use(reescribirPanel)
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), rutasDelPanel()],
  /*
   * La ruta del panel llega al código del panel como constante de
   * compilación. Importar api/_shared/ruta.ts desde el navegador no sirve en
   * desarrollo: el módulo se pediría como /api/..., que es el prefijo de las
   * funciones. El sitio público no la usa, así que no la incluye.
   */
  define: {
    __RUTA_PANEL__: JSON.stringify(RUTA_PANEL),
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    rollupOptions: {
      /*
       * Dos páginas con bundles separados: el sitio público no carga nada del
       * panel ni conoce su ruta.
       */
      input: {
        sitio: fileURLToPath(new URL('./index.html', import.meta.url)),
        panel: fileURLToPath(new URL(`.${RUTA_PANEL}.html`, import.meta.url)),
      },
    },
  },
})
