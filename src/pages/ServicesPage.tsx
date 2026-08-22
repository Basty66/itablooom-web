import { useState, useEffect } from 'react';
import { SearchX } from 'lucide-react';
import type { Service } from '../types';
import { getServices } from '../lib/api';
import { CATEGORIAS_GODDESS } from '../lib/categorias';
import ServiceCard from '../components/ServiceCard';
import { Section, SectionHeading } from '../components/ui/Section';
import { ServiceCardSkeleton } from '../components/ui/Skeleton';

const CATEGORIAS = CATEGORIAS_GODDESS;

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [categoria, setCategoria] = useState<string>('all');

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    setError(false);
    try {
      setServices(await getServices());
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }

  const visibles =
    categoria === 'all' ? services : services.filter((s) => s.category === categoria);

  return (
    <Section className="bg-tinta-900">
      <SectionHeading
        as="h1"
        eyebrow="Catálogo"
        title="Nuestros servicios"
        subtitle="Uñas, pestañas y cejas. Todo con hora reservada."
      />

      <div
        role="tablist"
        aria-label="Filtrar por categoría"
        className="mt-12 flex flex-wrap justify-center gap-2"
      >
        {CATEGORIAS.map((cat) => {
          const activa = categoria === cat.id;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={activa}
              onClick={() => setCategoria(cat.id)}
              className={`rounded-full px-6 py-2.5 texto--1 font-medium transition-all duration-200 ease-out active:scale-95 ${
                activa
                  ? 'bg-dorado-400 text-tinta-900 shadow-sm'
                  : 'border border-crema-100/15 text-nacar-200/80 hover:border-dorado-400 hover:text-crema-100'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cargando &&
          Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)}

        {!cargando &&
          visibles.map((service, i) => (
            <ServiceCard key={service.id} service={service} delay={i * 80} prioritaria={i < 3} />
          ))}
      </div>

      {!cargando && error && (
        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-crema-100/12 superficie p-10 text-center">
          <p className="texto-1 mb-2 text-crema-100">No pudimos cargar los tratamientos</p>
          <p className="mb-6 texto--1 text-nacar-200/80">Revisa tu conexión e intentá de nuevo.</p>
          <button
            onClick={cargar}
            className="rounded-full bg-tinta-900 px-6 py-2.5 texto--1 font-medium text-crema-100 transition-all duration-200 hover:bg-tinta-800 active:scale-95"
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && visibles.length === 0 && (
        <div className="mt-8 flex flex-col items-center py-16 text-center">
          <SearchX size={30} strokeWidth={1.3} className="mb-4 text-crema-100/40" aria-hidden="true" />
          <p className="text-nacar-200/80">No hay tratamientos en esta categoría.</p>
        </div>
      )}
    </Section>
  );
}
