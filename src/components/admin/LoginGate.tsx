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
    <div className="flex min-h-[70vh] items-center bg-crema-100 py-16">
      <Container className="max-w-md">
        <div className="rounded-3xl border border-tinta-900/8 bg-crema-50 p-8 shadow-[0_20px_60px_-40px_rgba(20,16,14,0.5)]">
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-rosa-200">
            <Lock size={22} strokeWidth={1.5} className="text-tinta-900" aria-hidden="true" />
          </span>

          <h1 className="text-center texto-2 text-tinta-900">Panel de administración</h1>
          <p className="mt-2 text-center texto--1 text-tinta-600">
            Esta sección contiene datos de tus clientas.
          </p>

          <form onSubmit={onSubmit} className="mt-8">
            <label className="block">
              <span className="mb-1.5 block texto--1 font-medium text-tinta-700">Contraseña</span>
              <input
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-tinta-900/15 bg-crema-50 px-4 py-3 texto-0 text-tinta-900 transition-colors duration-200 hover:border-tinta-900/25 focus:border-rosa-400 focus:outline-none"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p
                role="alert"
                className="anim-entrada mt-4 flex items-center gap-2 rounded-xl bg-rosa-100 px-4 py-3 texto--1 text-tinta-800"
              >
                <AlertCircle size={15} strokeWidth={1.5} className="shrink-0 text-rosa-600" aria-hidden="true" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando || password.length === 0}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-tinta-900 px-6 py-3 texto-0 font-medium text-crema-100 transition-all duration-200 ease-out hover:bg-tinta-800 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
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
