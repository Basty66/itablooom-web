import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { nombreDelAparato, panelApi } from './api-panel';

/**
 * Face ID / huella. La biometría nunca sale del teléfono: desbloquea una
 * llave privada guardada en el propio aparato, que firma un desafío del
 * servidor.
 */

/** ¿Este aparato tiene Face ID, Touch ID o huella utilizable? */
export async function huellaPosible(): Promise<boolean> {
  try {
    return browserSupportsWebAuthn() && (await platformAuthenticatorIsAvailable());
  } catch {
    return false;
  }
}

export async function activarHuella(): Promise<void> {
  const opciones = await panelApi.acceso<PublicKeyCredentialCreationOptionsJSON>('opciones-registro');
  const respuesta = await startRegistration({ optionsJSON: opciones });
  await panelApi.acceso('registrar', { respuesta, aparato: nombreDelAparato() });
}

/** Entra con Face ID: el servidor comprueba la firma y abre la sesión. */
export async function entrarConHuella(): Promise<void> {
  const opciones = await panelApi.acceso<PublicKeyCredentialRequestOptionsJSON>('opciones-entrada');
  const respuesta = await startAuthentication({ optionsJSON: opciones });
  await panelApi.acceso('entrar', { respuesta });
}

export const quitarHuella = () => panelApi.acceso('quitar');

/** Cómo se llama la biometría en este aparato, para los botones. */
export function nombreHuella(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'Face ID';
  if (/Mac/.test(ua)) return 'Touch ID';
  return 'tu huella';
}

/** Para títulos: "Face ID", "Touch ID" o "Tu huella". */
export function tituloHuella(): string {
  const nombre = nombreHuella();
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

/** Mensaje entendible para lo que puede salir mal. */
export function mensajeHuella(e: unknown): string {
  const nombre = (e as { name?: string })?.name;
  if (nombre === 'NotAllowedError' || nombre === 'AbortError') {
    return 'Se canceló o no se reconoció. Prueba de nuevo o usa tu contraseña.';
  }
  if (nombre === 'InvalidStateError') return `${nombreHuella()} ya está activado en este teléfono.`;
  return e instanceof Error ? e.message : `No se pudo usar ${nombreHuella()}.`;
}
