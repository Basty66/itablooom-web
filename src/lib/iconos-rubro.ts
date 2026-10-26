import { LayoutGrid, Hand, Eye, Brush, type LucideIcon } from 'lucide-react';

/**
 * Un ícono por rubro, por la clave de `category`. Se reconoce la opción
 * antes de leerla, y son trazos: se ven igual en todos los teléfonos, cosa
 * que un emoji no garantiza.
 */
export const ICONOS_RUBRO: Record<string, LucideIcon> = {
  all: LayoutGrid,
  facial: Hand,
  laser: Eye,
  course: Brush,
};
