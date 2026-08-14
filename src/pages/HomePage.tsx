import { useState, useEffect } from 'react';
import { CalendarHeart } from 'lucide-react';
import type { Service } from '../types';
import { getServices } from '../lib/api';
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
    let vigente = true;
    getServices()
      .then((data) => vigente && setServices(data.slice(0, 3)))
      .catch(() => vigente && setServices([]))
      .finally(() => vigente && setCargando(false));
    // Evita setState si el usuario navega antes de que responda la API.
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <>
      <Hero />
      <ComoFunciona />

      <Section className="bg-crema-200/60">
        <SectionHeading
          eyebrow="Tratamientos"
          title="Los más pedidos"
          subtitle="Cada servicio incluye su duración y valor. Elige y reserva al instante."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cargando
            ? Array.from({ length: 3 }).map((_, i) => <ServiceCardSkeleton key={i} />)
            : services.map((service, i) => (
                <ServiceCard key={service.id} service={service} delay={i * 90} />
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
