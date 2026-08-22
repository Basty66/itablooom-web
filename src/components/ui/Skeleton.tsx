/**
 * Placeholders de carga. Replican la estructura real del contenido para que
 * al llegar los datos no haya salto de layout (CLS).
 */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-crema-100/10 ${className}`} />;
}

/**
 * Sigue las dos formas de la tarjeta real: fila con la foto al costado en
 * móvil y columna desde sm. Con la forma antigua (siempre foto arriba en
 * 16/9) el contenido saltaba de sitio al terminar de cargar.
 */
export function ServiceCardSkeleton() {
  return (
    <div className="flex h-[240px] overflow-hidden rounded-2xl border border-crema-100/5 bg-tinta-880 sm:h-auto sm:flex-col">
      <Skeleton className="w-[38%] shrink-0 rounded-none sm:aspect-square sm:w-full" />
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-6">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-auto h-10 w-full" />
      </div>
    </div>
  );
}

export function TimeSlotSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-11 rounded-xl" />
      ))}
    </div>
  );
}
