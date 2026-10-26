import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdminPage from '../pages/AdminPage';
import Acceso from './Acceso';
import Ajustes from './Ajustes';
import { panelApi } from './api-panel';
import { mantenerAvisosAlDia } from './avisos';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'acceso'; huella: boolean; activa: boolean }
  | { fase: 'dentro'; huella: boolean };

/** Ya pasó por Face ID en esta apertura de la app. */
const CLAVE_DESBLOQUEO = 'goddess-panel-desbloqueado';

/** Tiempo en segundo plano tras el cual Face ID se vuelve a pedir. */
const CANDADO_MS = 5 * 60 * 1000;

function marcarDesbloqueo(abierto: boolean) {
  try {
    if (abierto) sessionStorage.setItem(CLAVE_DESBLOQUEO, '1');
    else sessionStorage.removeItem(CLAVE_DESBLOQUEO);
  } catch {
    /* sin almacenamiento: se pedirá Face ID en cada carga, que es lo seguro */
  }
}

function yaDesbloqueado(): boolean {
  try {
    return sessionStorage.getItem(CLAVE_DESBLOQUEO) === '1';
  } catch {
    return false;
  }
}

/**
 * La app del panel: decide entre la pantalla de acceso y la agenda.
 *
 * Con Face ID activado en el teléfono funciona como el candado de una app
 * de banco: se pide al abrirla y otra vez si quedó más de cinco minutos en
 * segundo plano. Así el teléfono desbloqueado y prestado no basta para ver
 * la agenda y los datos de las clientas. Sin Face ID, manda la sesión de
 * siempre.
 */
export default function PanelApp() {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const ocultoDesde = useRef<number | null>(null);

  const revisar = useCallback(async () => {
    try {
      const { activa, huella } = await panelApi.sesion();
      if (activa && (!huella || yaDesbloqueado())) {
        setEstado({ fase: 'dentro', huella });
        mantenerAvisosAlDia();
      } else {
        setEstado({ fase: 'acceso', huella, activa });
      }
    } catch {
      setEstado({ fase: 'acceso', huella: false, activa: false });
    }
  }, []);

  useEffect(() => {
    revisar();
  }, [revisar]);

  // Candado al volver del segundo plano.
  useEffect(() => {
    const alCambiar = () => {
      if (document.hidden) {
        ocultoDesde.current = Date.now();
        return;
      }
      const desde = ocultoDesde.current;
      ocultoDesde.current = null;
      if (desde && Date.now() - desde > CANDADO_MS) {
        setEstado((e) => {
          if (e.fase !== 'dentro' || !e.huella) return e;
          marcarDesbloqueo(false);
          return { fase: 'acceso', huella: true, activa: true };
        });
      }
    };
    document.addEventListener('visibilitychange', alCambiar);
    return () => document.removeEventListener('visibilitychange', alCambiar);
  }, []);

  const entrar = useCallback(() => {
    marcarDesbloqueo(true);
    // La sesión pudo cambiar (Face ID recién activado): se vuelve a leer.
    revisar();
  }, [revisar]);

  const salir = useCallback(async () => {
    await panelApi.salir().catch(() => undefined);
    marcarDesbloqueo(false);
    revisar();
  }, [revisar]);

  const vencida = useCallback(() => {
    marcarDesbloqueo(false);
    revisar();
  }, [revisar]);

  if (estado.fase === 'cargando') {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-tinta-900">
        <Loader2 size={30} strokeWidth={1.3} className="animate-spin text-cobre-400" aria-hidden="true" />
        <span className="sr-only">Abriendo tu estudio…</span>
      </div>
    );
  }

  if (estado.fase === 'acceso') {
    return (
      <Acceso
        key={`${estado.huella}-${estado.activa}`}
        huella={estado.huella}
        sesionActiva={estado.activa}
        onDentro={entrar}
      />
    );
  }

  return <AdminPage onSalir={salir} onSesionVencida={vencida} ajustes={<Ajustes onSalir={salir} />} />;
}
