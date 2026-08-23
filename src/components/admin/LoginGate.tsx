import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { adminIngresar } from '../../lib/api';

/**
 * Pantalla de acceso al panel. La contraseña solo viaja al servidor.
 *
 * Ocupa la pantalla completa y va centrada de verdad: con el panel sin barra
 * superior ni pie, la tarjeta quedaba flotando en el tercio de arriba con todo
 * el resto vacío. Lleva la marca, para que se note que es el mismo sitio, y
 * una salida de vuelta al público.
 */
export default function LoginGate({ onEntrar }: { onEntrar: () => void }) {
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError('');

    const r = await adminIngresar(password);
    if (r.ok) {
      setPassword('');
      onEntrar();
    } else {
      setError(r.error || 'No se pudo iniciar sesión');
      setEnviando(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-tinta-900 px-5 py-12">
      {/* Velo rosado detrás, el mismo recurso que abre el catálogo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rosa-500/10 blur-[100px]"
      />

      <div className="relative w-full max-w-sm">
        {/* La marca, para que se lea como el mismo sitio y no como una
            pantalla de sistema ajena. */}
        <div className="mb-8 flex items-baseline justify-center gap-2">
          <span className="font-display texto-3 font-medium tracking-tight text-crema-100">
            Goddess
          </span>
          <span className="texto--1 uppercase tracking-[0.25em] text-rosa-300">Studio</span>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-crema-100/8 bg-tinta-870 p-7 sm:p-8">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rosa-300/50 to-transparent"
          />

          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-dorado-400/40 bg-tinta-860">
            <Lock size={21} strokeWidth={1.5} className="text-dorado-300" aria-hidden="true" />
          </span>

          <h1 className="mt-6 text-center font-display texto-3 text-crema-100">Panel del estudio</h1>
          <p className="mx-auto mt-2 max-w-[30ch] text-center texto--1 leading-relaxed text-nacar-200/80">
            Tu agenda, tus cobros y los datos de tus clientas.
          </p>

          <form onSubmit={onSubmit} className="mt-8" autoComplete="off">
            {/* Campo oculto de usuario: sin él, los gestores de contraseñas
                guardan la clave sin saber a qué cuenta corresponde. */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <label className="block">
              <span className="mb-2 block texto--2 uppercase espaciado-amplio text-nacar-300">
                Contraseña
              </span>
              <input
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="campo w-full px-4 py-3.5 texto-0 tracking-[0.2em]"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p
                role="alert"
                className="anim-entrada mt-4 flex items-center gap-2 rounded-[var(--radius-suave)] border border-rosa-400/30 bg-rosa-500/10 px-4 py-3 texto--1 text-rosa-300"
              >
                <AlertCircle size={15} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando || password.length === 0}
              className="brillo brillo-hover mt-6 flex w-full items-center justify-center gap-2 rounded-[var(--radius-suave)] bg-rosa-300 px-6 py-3.5 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-all duration-300 ease-out hover:bg-rosa-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
            >
              {enviando ? (
                <>
                  <Loader2 size={17} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
                  Verificando…
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        <Link
          to="/"
          className="mx-auto mt-6 flex w-fit items-center gap-2 py-2 texto--1 uppercase espaciado-medio text-nacar-300 transition-colors duration-300 hover:text-crema-100"
        >
          <ArrowLeft size={15} strokeWidth={1.5} aria-hidden="true" />
          Volver al sitio
        </Link>
      </div>
    </div>
  );
}
