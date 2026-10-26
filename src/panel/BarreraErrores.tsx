import { Component, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import PantallaEstado from '../components/PantallaEstado';
import BotonLujo from '../components/ui/BotonLujo';

/**
 * Si algo del panel se cae, Ignacia ve esto y no una pantalla en blanco: en
 * una app instalada no hay barra del navegador para recargar, así que el
 * botón es la única salida.
 */
export default class BarreraErrores extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };

  static getDerivedStateFromError() {
    return { error: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Error en el panel:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <PantallaEstado
        icono={RefreshCw}
        rotulo="Algo no cargó bien"
        titulo="Vuelve a"
        acento="intentarlo."
        texto="Tu agenda está a salvo: esto fue un error al mostrarla. Recarga y debería volver todo."
      >
        <BotonLujo onClick={() => window.location.reload()}>Recargar</BotonLujo>
      </PantallaEstado>
    );
  }
}
