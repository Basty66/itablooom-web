import { useState, useEffect } from 'react';
import { CalendarHeart } from 'lucide-react';
import type { Service } from '../types';
import { SERVICIOS_PRUEBA } from '../lib/datos-prueba';
import Hero from '../components/home/Hero';
import ComoFunciona from '../components/home/ComoFunciona';
import Faq from '../components/home/Faq';
import ServiceCard from '../components/ServiceCard';
import Button from '../components/ui/Button';
import { Section, SectionHeading, Container } from '../components/ui/Section';
import { ServiceCardSkeleton } from '../components/ui/Skeleton';

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // MAQUETA: datos de prueba en vez de la API. Al conectar la base real,
    // volver a getServices() y borrar lib/datos-prueba.ts.
    const t = setTimeout(() => {
      setServices(SERVICIOS_PRUEBA.slice(0, 3));
      setCargando(false);
    }, 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Hero />
      <ComoFunciona />

      <Section className="bg-nude-100">
        <SectionHeading
          eyebrow="Tratamientos"
          title="Los más pedidos"
          subtitle="Cada servicio muestra su duración y valor. Elige y reserva al instante."
        />

        {/*
          En móvil las tres tarjetas apiladas ocupaban 2,3 pantallas de scroll.
          Acá van en carrusel con scroll-snap: se ve una a la vez y las demás
          asoman invitando a deslizar. Desde sm vuelve a ser grilla normal.
          Los márgenes negativos permiten que el carrusel sangre hasta el borde
          sin romper el ancho del contenedor.
        */}
        <div className="-mx-5 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
          {cargando
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[78%] shrink-0 snap-center sm:w-auto">
                  <ServiceCardSkeleton />
                </div>
              ))
            : services.map((service, i) => (
                <ServiceCard
                  className="w-[78%] shrink-0 snap-center sm:w-auto"
                  key={service.id}
                  service={service}
                  delay={i * 90}
                  prioritaria={i === 0}
                />
              ))}
        </div>

        {!cargando && services.length > 0 && (
          <div className="mt-12 text-center">
            <Button to="/servicios" variant="outline" size="md">
              Ver todos los tratamientos
            </Button>
          </div>
        )}
      </Section>

      <Faq />

      {/* Cierre: última oportunidad de conversión antes del footer. */}
      <section className="textura-papel relative overflow-hidden bg-tinta-900 py-20 md:py-28">
        <div
          aria-hidden="true"
          className="absolute -bottom-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-rosa-500/20 blur-3xl"
        />
        <Container className="relative text-center">
          <h2 className="texto-3 text-crema-100">
            ¿Lista para tu próxima
            <span className="italic text-rosa-300"> sesión?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-crema-100/70">
            Elige tu tratamiento y asegura tu horario en menos de un minuto.
          </p>
          <div className="mt-9 flex justify-center">
            <Button to="/agendar" size="lg" variant="secondary">
              <CalendarHeart size={18} strokeWidth={1.5} />
              Reservar mi hora
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
