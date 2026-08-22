import { useState, type FormEvent } from 'react';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { adminIngresar } from '../../lib/api';
import { Container } from '../ui/Section';

/** Pantalla de acceso al panel. La contraseña solo viaja al servidor. */
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
    <div className="flex min-h-[70vh] items-center bg-tinta-900 py-16">
      <Container className="max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-crema-100/5 bg-tinta-870 p-8">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rosa-300/50 to-transparent"
          />
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-dorado-400/40 bg-tinta-860">
            <Lock size={22} strokeWidth={1.5} className="text-dorado-300" aria-hidden="true" />
          </span>

          <h1 className="text-center font-display texto-3 text-crema-100">Panel del estudio</h1>
          <p className="mt-2 text-center texto--1 text-nacar-200/80">
            Esta sección contiene datos de tus clientas.
          </p>

          <form onSubmit={onSubmit} className="mt-8" autoComplete="off">
            <input type="text" name="username" autoComplete="username" className="sr-only" tabIndex={-1} aria-hidden="true" />
            <label className="block">
              <span className="mb-2 block texto--1 font-medium uppercase espaciado-medio text-nacar-200/85">
                Contraseña
              </span>
              <input
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="campo w-full px-3 py-3 texto-0"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p
                role="alert"
                className="anim-entrada mt-4 flex items-center gap-2 linea-oro border px-4 py-3 texto--1 text-nacar-100"
              >
                <AlertCircle size={15} strokeWidth={1.5} className="shrink-0 text-dorado-300" aria-hidden="true" />
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
      </Container>
    </div>
  );
}
