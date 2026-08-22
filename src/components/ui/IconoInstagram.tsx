/**
 * lucide-react quitó los iconos de marcas, así que Instagram va como SVG
 * propio. Vive acá y no dentro del pie porque el menú móvil lo necesita
 * igual, y tener dos copias del mismo trazo se desincroniza sola.
 */
export default function IconoInstagram({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
