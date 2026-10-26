import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Fingerprint, Loader2, ScanFace, KeyRound } from 'lucide-react';
import Emblema from '../components/ui/Emblema';
import { panelApi } from './api-panel';
import { activarHuella, entrarConHuella, huellaPosible, mensajeHuella, nombreHuella } from './huella';

type Modo = 'huella' | 'contrasena' | 'ofrecer';

interface Props {
  /** Este teléfono ya tiene Face ID activado. */
  huella: boolean;
  /** Ya hay sesión abierta: Face ID solo desbloquea la app. */
  sesionActiva: boolean;
  onDentro: () => void;
}

const esIphone = () => /iPhone|iPad/.test(navigator.userAgent);

/**
 * Pantalla de acceso del panel.
 *
 * Con Face ID activado en el teléfono, lo primero es el botón de Face ID y
 * la contraseña queda de respaldo. Sin Face ID, la contraseña; y apenas entra
 * con ella, se le ofrece activarlo para que sea la última vez que la escribe
 * en ese teléfono.
 */
export default function Acceso({ huella, sesionActiva, onDentro }: Props) {
  const [modo, setModo] = useState<Modo>(huella ? 'huella' : 'contrasena');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [puedeHuella, setPuedeHuella] = useState(false);

  useEffect(() => {
    huellaPosible().then(setPuedeHuella);
  }, []);

  const IconoHuella = esIphone() ? ScanFace : Fingerprint;

  async function conHuella() {
    setOcupado(true);
    setError('');
    try {
      await entrarConHuella();
      onDentro();
    } catch (e) {
      setError(mensajeHuella(e));
    } finally {
      setOcupado(false);
    }
  }

  async function conContrasena(e: FormEvent) {
    e.preventDefault();
    if (!password) return;
    setOcupado(true);
    setError('');
    try {
      await panelApi.ingresar(password);
      setPassword('');
      // Primera vez en este teléfono: se ofrece Face ID antes de entrar.
      if (!huella && puedeHuella) setModo('ofrecer');
      else onDentro();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar.');
    } finally {
      setOcupado(false);
    }
  }

  async function activar() {
    setOcupado(true);
    setError('');
    try {
      await activarHuella();
      onDentro();
    } catch (e) {
      setError(mensajeHuella(e));
      setOcupado(false);
    }
  }

  return (
    <div className="luz-vino relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 py-12 text-center">
      <Emblema className="pointer-events-none absolute -bottom-24 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 opacity-[0.06]" sinLetra />

      <div className="relative w-full max-w-sm">
        <Emblema className="anim-entrada mx-auto h-24 w-24" titulo="Goddess Studio" />

        <p className="anim-entrada mt-8 texto--1 uppercase espaciado-amplio text-cobre-300" style={{ animationDelay: '80ms' }}>
          Mi estudio
        </p>
        <h1 className="anim-entrada mt-3 font-display texto-4 text-crema-100" style={{ animationDelay: '140ms' }}>
          {modo === 'ofrecer' ? (
            <>
              Entra con <span className="texto-metal pr-1 italic">{nombreHuella()}</span>
            </>
          ) : (
            <>
              Hola, <span className="texto-metal pr-1 italic">Ignacia</span>
            </>
          )}
        </h1>
        <p className="anim-entrada mt-3 texto-0 text-nacar-200/80" style={{ animationDelay: '200ms' }}>
          {modo === 'ofrecer'
            ? `La próxima vez entras mirando el teléfono, sin escribir la contraseña.`
            : modo === 'huella'
              ? sesionActiva
                ? 'Desbloquea tu agenda.'
                : 'Tu agenda te espera.'
              : 'Escribe tu contraseña para entrar.'}
        </p>

        <div className="anim-entrada mt-10" style={{ animationDelay: '260ms' }}>
          {modo === 'huella' && (
            <button
              type="button"
              onClick={conHuella}
              disabled={ocupado}
              className="boton-metal group mx-auto flex w-full items-center justify-center gap-3 rounded-full py-4 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-transform duration-300 active:scale-[0.97] disabled:opacity-60"
            >
              {ocupado ? (
                <Loader2 size={20} strokeWidth={1.6} className="animate-spin" aria-hidden="true" />
              ) : (
                <IconoHuella size={22} strokeWidth={1.6} aria-hidden="true" />
              )}
              Entrar con {nombreHuella()}
            </button>
          )}

          {modo === 'contrasena' && (
            <form onSubmit={conContrasena} className="flex flex-col gap-3 text-left">
              <label className="relative block">
                <span className="sr-only">Contraseña</span>
                <KeyRound
                  size={17}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cobre-300"
                />
                <input
                  type={verPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  autoFocus
                  className="campo w-full py-4 pl-11 pr-12 texto-0"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-nacar-300 transition-colors hover:text-crema-100"
                >
                  {verPassword ? <EyeOff size={17} strokeWidth={1.5} /> : <Eye size={17} strokeWidth={1.5} />}
                </button>
              </label>
              <button
                type="submit"
                disabled={ocupado || !password}
                className="boton-metal flex w-full items-center justify-center gap-2 rounded-full py-4 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-transform duration-300 active:scale-[0.97] disabled:opacity-50"
              >
                {ocupado && <Loader2 size={18} strokeWidth={1.6} className="animate-spin" aria-hidden="true" />}
                Entrar
              </button>
            </form>
          )}

          {modo === 'ofrecer' && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={activar}
                disabled={ocupado}
                className="boton-metal flex w-full items-center justify-center gap-3 rounded-full py-4 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-transform duration-300 active:scale-[0.97] disabled:opacity-60"
              >
                {ocupado ? (
                  <Loader2 size={20} strokeWidth={1.6} className="animate-spin" aria-hidden="true" />
                ) : (
                  <IconoHuella size={22} strokeWidth={1.6} aria-hidden="true" />
                )}
                Activar {nombreHuella()}
              </button>
              <button
                type="button"
                onClick={onDentro}
                className="py-3 texto--1 uppercase espaciado-medio text-nacar-300 transition-colors hover:text-crema-100"
              >
                Ahora no
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="anim-entrada mt-5 texto--1 leading-relaxed text-rosa-200">
              {error}
            </p>
          )}

          {/* Cambiar de método: Face ID ↔ contraseña. */}
          {modo === 'huella' && (
            <button
              type="button"
              onClick={() => {
                setModo('contrasena');
                setError('');
              }}
              className="mt-6 py-2 texto--1 uppercase espaciado-medio text-nacar-300 transition-colors hover:text-crema-100"
            >
              Usar contraseña
            </button>
          )}
          {modo === 'contrasena' && huella && (
            <button
              type="button"
              onClick={() => {
                setModo('huella');
                setError('');
              }}
              className="mt-6 py-2 texto--1 uppercase espaciado-medio text-nacar-300 transition-colors hover:text-crema-100"
            >
              Usar {nombreHuella()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
