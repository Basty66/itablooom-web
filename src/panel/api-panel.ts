/**
 * Llamadas propias de la app del panel: sesión, Face ID y avisos. Las de la
 * agenda y las finanzas siguen en src/lib/api.ts, que comparte con el sitio.
 *
 * Todas van con la cookie de sesión (HttpOnly): el token nunca pasa por el
 * JavaScript de la página.
 */
export class ErrorPanel extends Error {
  /** Código HTTP; 0 si no hubo respuesta. */
  estado: number;
  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.estado = estado;
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(ruta, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(20000),
      ...opciones,
    });
  } catch {
    throw new ErrorPanel('Sin conexión. Revisa la señal e intenta de nuevo.', 0);
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErrorPanel(datos.error || 'No se pudo completar.', res.status);
  return datos as T;
}

const enviar = (cuerpo: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(cuerpo) });

export interface EstadoSesion {
  activa: boolean;
  /** Este teléfono tiene Face ID activado para entrar. */
  huella: boolean;
}

export interface LlaveActivada {
  aparato: string | null;
  creado_en: string;
  ultimo_uso: string | null;
  /** Es la de este mismo aparato. */
  esta: boolean;
}

export const panelApi = {
  sesion: () => pedir<EstadoSesion>('/api/admin/session'),
  ingresar: (password: string) => pedir<{ activa: boolean }>('/api/admin/session', enviar({ password })),
  salir: () => pedir<{ activa: boolean }>('/api/admin/session', { method: 'DELETE' }),

  acceso: <T = { ok: boolean }>(accion: string, cuerpo: Record<string, unknown> = {}) =>
    pedir<T>('/api/admin/acceso', enviar({ accion, ...cuerpo })),
  llaves: () => pedir<{ llaves: LlaveActivada[] }>('/api/admin/acceso'),

  avisos: <T = { ok: boolean }>(accion: string, cuerpo: Record<string, unknown> = {}) =>
    pedir<T>('/api/admin/avisos', enviar({ accion, ...cuerpo })),
  llaveAvisos: () => pedir<{ llave: string; disponibles: boolean }>('/api/admin/avisos'),
};

/** "iPhone · Safari", para reconocer cada aparato en Ajustes. */
export function nombreDelAparato(): string {
  const ua = navigator.userAgent;
  const aparato = /iPhone/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua)
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /Mac/.test(ua)
          ? 'Mac'
          : /Windows/.test(ua)
            ? 'Windows'
            : 'Computador';
  const navegador = /CriOS|Chrome/.test(ua) ? 'Chrome' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : '';
  return navegador ? `${aparato} · ${navegador}` : aparato;
}
