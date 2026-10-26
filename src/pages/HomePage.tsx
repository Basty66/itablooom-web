import { useState, useEffect, type CSSProperties } from 'react';
import { BookOpen } from 'lucide-react';
import type { Service } from '../types';
import { getServices } from '../lib/api';
import Hero from '../components/home/Hero';
import ComoFunciona from '../components/home/ComoFunciona';
import Manifiesto from '../components/home/Manifiesto';
import Reels from '../components/home/Reels';
import AntesDespues from '../components/home/AntesDespues';
import Testimonio from '../components/home/Testimonio';
import SobreMi from '../components/home/SobreMi';
import Faq from '../components/home/Faq';
import Cierre from '../components/home/Cierre';
import ServiceCard from '../components/ServiceCard';
import BotonLujo from '../components/ui/BotonLujo';
import { Section, SectionHeading } from '../components/ui/Section';
import Trazo from '../components/ui/Trazo';
import { ServiceCardSkeleton } from '../components/ui/Skeleton';

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    getServices()
      /* Los complementos quedan fuera de los destacados: la portada muestra
         lo que se puede reservar, no lo que se agrega a otra hora. */
      .then((data) => vigente && setServices(data.filter((s) => !s.es_complemento).slice(0, 3)))
      .catch(() => vigente && setServices([]))
      .finally(() => vigente && setCargando(false));
    // Evita setState si la clienta navega antes de que responda la API.
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <>
      <Hero />
      {/* De la promesa del hero a lo que se siente estar ahí. */}
      <Manifiesto />
      <ComoFunciona />

      {/* Cierra el bloque de "cómo es venir" y abre el de resultados. */}
      <Trazo forma="baja" />

      {/* Los resultados van antes del catálogo: convencen justo antes de
          que la clienta vea los precios, y ahí es donde más pesan. */}
      <AntesDespues />

      <Section className="tono-cacao">
        <SectionHeading
          eyebrow="Especialidades"
          title="Nuestros servicios"
          destacar="servicios"
          subtitle="Cada servicio muestra su duración y valor. Elige y reserva al instante."
        />

        {/*
          En móvil las tres tarjetas apiladas ocupaban 2,3 pantallas de scroll.
          Acá van en carrusel con scroll-snap: se ve una a la vez y las demás
          asoman invitando a deslizar. Desde sm vuelve a ser grilla normal.
          Los márgenes negativos permiten que el carrusel sangre hasta el borde
          sin romper el ancho del contenedor.
        */}
        {/*
          En el teléfono, carrusel con foco: la tarjeta del centro a tamaño
          completo y las vecinas achicadas mientras se desliza. Desde sm vuelve
          a ser grilla, y en escritorio la del medio va más arriba y sube a
          otra velocidad con el scroll: la fila deja de ser un bloque parejo.
        */}
        <div className="-mx-5 mt-14 flex snap-x snap-mandatory gap-4 sin-barra overflow-x-auto px-[11%] pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-14 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 lg:gap-x-10 lg:pt-16">
          {cargando
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[78%] shrink-0 snap-center sm:w-auto">
                  <ServiceCardSkeleton />
                </div>
              ))
            : services.map((service, i) => (
                <div
                  key={service.id}
                  className={`carrusel-foco w-[78%] shrink-0 snap-center sm:w-auto ${i === 1 ? 'lg:-mt-16' : ''}`}
                >
                  <div className="parallax-suave" style={{ '--vel': i === 1 ? 0.8 : -0.3 } as CSSProperties}>
                    <ServiceCard service={service} delay={i * 90} prioritaria={i === 0} />
                  </div>
                </div>
              ))}
        </div>

        {!cargando && services.length > 0 && (
          <div className="mt-14 flex justify-center">
            <BotonLujo to="/servicios" variante="vidrio" icono={BookOpen}>
              Ver la carta completa
            </BotonLujo>
          </div>
        )}
      </Section>

      <Reels />

      {/* Del portafolio a la persona: la curva sube, para no repetir el gesto
          del trazo anterior. */}
      <Trazo forma="sube" />

      <SobreMi />

      <Faq />

      {/* La voz de una clienta justo antes del cierre: es donde más pesa, y de
          paso el vino corta el negro antes del bloque claro. */}
      <Testimonio />

      {/* Cierre: última oportunidad de conversión antes del footer. */}
      <Cierre />
    </>
  );
}
