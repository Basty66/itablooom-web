import { useEffect, useState, type ReactNode } from 'react';
import {
  BellRing,
  Check,
  Download,
  Fingerprint,
  Loader2,
  LogOut,
  ScanFace,
  Share,
  SquarePlus,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { panelApi, type LlaveActivada } from './api-panel';
import { activarHuella, huellaPosible, mensajeHuella, nombreHuella, quitarHuella, tituloHuella } from './huella';
import {
  apagarAvisos,
  encenderAvisos,
  esIos,
  estaInstalada,
  estadoAvisos,
  probarAvisos,
  type EstadoAvisos,
} from './avisos';
import { alCambiarInstalacion, type EventoInstalar } from './instalacion';

/** Tarjeta de ajuste: ícono en anillo de metal, título, texto y acciones. */
function Tarjeta({
  icono: Icono,
  titulo,
  estado,
  children,
}: {
  icono: LucideIcon;
  titulo: string;
  estado?: { texto: string; activo: boolean };
  children: ReactNode;
}) {
  return (
    <section className="relative rounded-[1.6rem] bg-tinta-870 p-6">
      <span aria-hidden="true" className="canto-metal absolute inset-0 rounded-[inherit]" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
            <span aria-hidden="true" className="canto-metal activo absolute inset-0 rounded-full" />
            <Icono size={19} strokeWidth={1.5} className="text-cobre-200" aria-hidden="true" />
          </span>
          <h2 className="font-display texto-2 text-crema-100">{titulo}</h2>
        </div>
        {estado && (
          <span
            className={`shrink-0 rounded-full px-3 py-1 texto--2 uppercase espaciado-medio ${
              estado.activo ? 'boton-metal text-vino-900' : 'border border-crema-100/15 text-nacar-300'
            }`}
          >
            {estado.texto}
          </span>
        )}
      </div>
      <div className="mt-4 texto-0 leading-relaxed text-nacar-200/85">{children}</div>
    </section>
  );
}

const botonMetal =
  'boton-metal inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-transform duration-300 active:scale-[0.97] disabled:opacity-50';
const botonVidrio =
  'inline-flex items-center justify-center gap-2 rounded-full border border-crema-100/15 px-6 py-3 texto--1 uppercase espaciado-medio text-nacar-200 transition-colors duration-300 hover:border-cobre-300/60 hover:text-crema-100 active:scale-[0.97] disabled:opacity-50';

export default function Ajustes({ onSalir }: { onSalir: () => void }) {
  // Face ID
  const [llaves, setLlaves] = useState<LlaveActivada[] | null>(null);
  const [puedeHuella, setPuedeHuella] = useState(false);
  const [ocupadoHuella, setOcupadoHuella] = useState(false);
  const [mensajeH, setMensajeH] = useState('');

  // Avisos
  const [avisos, setAvisos] = useState<EstadoAvisos>('cargando');
  const [llaveVapid, setLlaveVapid] = useState('');
  const [ocupadoAvisos, setOcupadoAvisos] = useState(false);
  const [mensajeA, setMensajeA] = useState('');

  // Instalación
  const [instalada] = useState(estaInstalada);
  const [promptInstalar, setPromptInstalar] = useState<EventoInstalar | null>(null);

  const estaHuella = llaves?.some((l) => l.esta) ?? false;
  const IconoHuella = esIos() ? ScanFace : Fingerprint;

  useEffect(() => {
    huellaPosible().then(setPuedeHuella);
    panelApi
      .llaves()
      .then((r) => setLlaves(r.llaves))
      .catch(() => setLlaves([]));
    panelApi
      .llaveAvisos()
      .then(async ({ llave, disponibles }) => {
        setLlaveVapid(llave);
        setAvisos(disponibles ? await estadoAvisos(llave) : 'sin-soporte');
      })
      .catch(() => setAvisos('sin-soporte'));
    return alCambiarInstalacion(setPromptInstalar);
  }, []);

  async function alternarHuella() {
    setOcupadoHuella(true);
    setMensajeH('');
    try {
      if (estaHuella) await quitarHuella();
      else await activarHuella();
      setLlaves((await panelApi.llaves()).llaves);
      setMensajeH(estaHuella ? `${nombreHuella()} desactivado en este teléfono.` : `Listo: ya puedes entrar con ${nombreHuella()}.`);
    } catch (e) {
      setMensajeH(mensajeHuella(e));
    } finally {
      setOcupadoHuella(false);
    }
  }

  async function alternarAvisos() {
    setOcupadoAvisos(true);
    setMensajeA('');
    try {
      if (avisos === 'encendido') {
        await apagarAvisos();
        setAvisos('apagado');
      } else {
        const nuevo = await encenderAvisos(llaveVapid);
        setAvisos(nuevo);
        if (nuevo === 'encendido') {
          const llegaron = await probarAvisos();
          setMensajeA(llegaron > 0 ? 'Te enviamos un aviso de prueba.' : 'Activados.');
        }
      }
    } catch (e) {
      setMensajeA(e instanceof Error ? e.message : 'No se pudo cambiar.');
    } finally {
      setOcupadoAvisos(false);
    }
  }

  async function probar() {
    setOcupadoAvisos(true);
    try {
      const n = await probarAvisos();
      setMensajeA(n > 0 ? 'Aviso de prueba enviado.' : 'No llegó: desactívalos y vuelve a activarlos.');
    } finally {
      setOcupadoAvisos(false);
    }
  }

  const textoAvisos: Record<EstadoAvisos, { texto: string; activo: boolean }> = {
    cargando: { texto: '…', activo: false },
    'sin-soporte': { texto: 'No disponible', activo: false },
    'necesita-instalar': { texto: 'Instala primero', activo: false },
    apagado: { texto: 'Apagados', activo: false },
    encendido: { texto: 'Activos', activo: true },
    bloqueado: { texto: 'Bloqueados', activo: false },
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display texto-4 text-crema-100">Ajustes</h1>
        <p className="mt-1 texto-0 text-nacar-200/80">Entrada con {nombreHuella()}, avisos y la app en tu teléfono.</p>
      </div>

      <div className="flex flex-col gap-4">
        <Tarjeta
          icono={IconoHuella}
          titulo={tituloHuella()}
          estado={llaves ? { texto: estaHuella ? 'Activo aquí' : 'Apagado', activo: estaHuella } : undefined}
        >
          <p>
            Entra mirando el teléfono, sin escribir la contraseña. Tu cara o tu huella nunca salen del
            teléfono: solo confirman que eres tú.
          </p>
          {!puedeHuella && !estaHuella ? (
            <p className="mt-3 texto--1 text-nacar-300">Este aparato no tiene {nombreHuella()} disponible.</p>
          ) : (
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={alternarHuella} disabled={ocupadoHuella || !llaves} className={estaHuella ? botonVidrio : botonMetal}>
                {ocupadoHuella && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {estaHuella ? 'Desactivar aquí' : `Activar ${nombreHuella()}`}
              </button>
            </div>
          )}
          {mensajeH && <p className="mt-3 texto--1 text-cobre-200">{mensajeH}</p>}
          {llaves && llaves.length > 0 && (
            <ul className="linea-cobre mt-5 space-y-2 border-t pt-4 texto--1 text-nacar-300">
              {llaves.map((l, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Smartphone size={14} strokeWidth={1.5} aria-hidden="true" />
                  {l.aparato ?? 'Aparato'}
                  {l.esta && <span className="text-cobre-200">· este</span>}
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta icono={BellRing} titulo="Avisos" estado={textoAvisos[avisos]}>
          <ul className="space-y-1.5">
            <li className="flex gap-2">
              <Check size={16} strokeWidth={1.8} className="mt-1 shrink-0 text-cobre-300" aria-hidden="true" />
              Cada reserva pagada, al instante.
            </li>
            <li className="flex gap-2">
              <Check size={16} strokeWidth={1.8} className="mt-1 shrink-0 text-cobre-300" aria-hidden="true" />
              Cada mañana, tus citas del día.
            </li>
          </ul>
          {avisos === 'necesita-instalar' && (
            <p className="mt-4 texto--1 text-cobre-200">
              En iPhone los avisos llegan solo con la app instalada. Sigue los pasos de abajo y ábrela desde
              la pantalla de inicio.
            </p>
          )}
          {avisos === 'bloqueado' && (
            <p className="mt-4 texto--1 text-cobre-200">
              Los bloqueaste para esta app. Actívalos en los ajustes del teléfono, en Notificaciones.
            </p>
          )}
          {(avisos === 'apagado' || avisos === 'encendido') && (
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={alternarAvisos} disabled={ocupadoAvisos} className={avisos === 'encendido' ? botonVidrio : botonMetal}>
                {ocupadoAvisos && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {avisos === 'encendido' ? 'Desactivar' : 'Activar avisos'}
              </button>
              {avisos === 'encendido' && (
                <button type="button" onClick={probar} disabled={ocupadoAvisos} className={botonVidrio}>
                  Enviar prueba
                </button>
              )}
            </div>
          )}
          {mensajeA && <p className="mt-3 texto--1 text-cobre-200">{mensajeA}</p>}
        </Tarjeta>

        <Tarjeta
          icono={Download}
          titulo="App en tu teléfono"
          estado={{ texto: instalada ? 'Instalada' : 'Sin instalar', activo: instalada }}
        >
          {instalada ? (
            <p>Estás usando la app instalada. Ábrela siempre desde la pantalla de inicio.</p>
          ) : esIos() ? (
            <ol className="space-y-3">
              <li className="flex items-center gap-3">
                <span className="texto-metal font-display texto-1 italic">1</span>
                Toca <Share size={17} strokeWidth={1.6} className="text-cobre-200" aria-label="Compartir" /> Compartir, abajo en Safari.
              </li>
              <li className="flex items-center gap-3">
                <span className="texto-metal font-display texto-1 italic">2</span>
                Elige <SquarePlus size={17} strokeWidth={1.6} className="text-cobre-200" aria-hidden="true" /> «Agregar a inicio».
              </li>
              <li className="flex items-center gap-3">
                <span className="texto-metal font-display texto-1 italic">3</span>
                Abre «Mi estudio» desde la pantalla de inicio.
              </li>
            </ol>
          ) : promptInstalar ? (
            <div className="mt-1">
              <p>Instálala para abrirla como una app, con su ícono y sin la barra del navegador.</p>
              <button
                type="button"
                onClick={async () => {
                  await promptInstalar.prompt();
                  await promptInstalar.userChoice;
                }}
                className={`${botonMetal} mt-5`}
              >
                <Download size={16} strokeWidth={1.6} aria-hidden="true" />
                Instalar app
              </button>
            </div>
          ) : (
            <p>Desde el menú del navegador, elige «Instalar app» o «Agregar a la pantalla de inicio».</p>
          )}
        </Tarjeta>

        <button type="button" onClick={onSalir} className={`${botonVidrio} mt-2 self-start`}>
          <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
