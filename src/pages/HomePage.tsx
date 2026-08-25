import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarHeart, ArrowRight } from 'lucide-react';
import type { Service } from '../types';
import { getServices } from '../lib/api';
import Hero from '../components/home/Hero';
import ComoFunciona from '../components/home/ComoFunciona';
import VideoBienvenida from '../components/home/VideoBienvenida';
import Reels from '../components/home/Reels';
import AntesDespues from '../components/home/AntesDespues';
import Testimonio from '../components/home/Testimonio';
import SobreMi from '../components/home/SobreMi';
import Faq from '../components/home/Faq';
import ServiceCard from '../components/ServiceCard';
import Button from '../components/ui/Button';
import { Section, SectionHeading, Container } from '../components/ui/Section';
import Revelar from '../components/ui/Revelar';
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
      <VideoBienvenida />
      <ComoFunciona />

      {/* Cierra el bloque de "cómo es venir" y abre el de resultados. */}
      <Trazo forma="baja" />

      {/* Los resultados van antes del catálogo: convencen justo antes de
          que la clienta vea los precios, y ahí es donde más pesan. */}
      <AntesDespues />

      <Section className="bg-tinta-900">
        <SectionHeading
          eyebrow="Especialidades"
          title="Nuestros servicios"
          subtitle="Cada servicio muestra su duración y valor. Elige y reserva al instante."
        />

        {/*
          En móvil las tres tarjetas apiladas ocupaban 2,3 pantallas de scroll.
          Acá van en carrusel con scroll-snap: se ve una a la vez y las demás
          asoman invitando a deslizar. Desde sm vuelve a ser grilla normal.
          Los márgenes negativos permiten que el carrusel sangre hasta el borde
          sin romper el ancho del contenedor.
        */}
        <div className="-mx-5 mt-14 flex snap-x snap-mandatory gap-4 sin-barra overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
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

        {/* Enlace con flecha en vez de botón: el CTA fuerte de la sección son
            las tarjetas, y otro bloque sólido acá les restaba peso. */}
        {!cargando && services.length > 0 && (
          <div className="mt-14 text-center">
            <Link
              to="/servicios"
              className="group -my-3 inline-flex items-center gap-3 py-3 texto--1 font-medium uppercase espaciado-amplio text-cobre-300 transition-colors duration-300 hover:text-cobre-200"
            >
              Ver menú completo
              <ArrowRight
                size={16}
                strokeWidth={1.5}
                aria-hidden="true"
                className="transition-transform duration-300 ease-out group-hover:translate-x-1"
              />
            </Link>
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
      {/* Único bloque claro del sitio: corta el negro y hace que el cierre resalte. */}
      <section className="bg-crema-100 py-20 md:py-28">
        <Container className="relative text-center">
          {/* Era la única sección que no se revelaba al llegar: al ser la
              última, aparecía ya puesta y el cierre perdía el gesto. */}
          <Revelar>
            <p className="texto--1 font-medium uppercase espaciado-amplio text-vino-900">
              Reserva tu hora
            </p>
            <h2 className="mt-5 texto-4 text-tinta-880">
              Sal de aquí sintiéndote
              <span className="italic text-vino-900"> diosa.</span>
            </h2>
            {/* Sin tope de ancho la línea llegaba a 128 caracteres: el ojo
                pierde el renglón al volver a la izquierda. */}
            <p className="mx-auto mt-4 max-w-[42ch] texto-1 text-tinta-600">
              Cuéntanos qué servicio te interesa y te confirmamos la disponibilidad el mismo día.
            </p>
          </Revelar>
          {/* Acá el secundario del sistema (cobre sobre oscuro) no sirve: sobre
              el crema el cobre se borra. Va el primario, que sí contrasta. */}
          <Revelar delay={160}>
            <div className="mt-9 flex justify-center">
              <Button to="/agendar" size="lg" variant="primary">
                <CalendarHeart size={18} strokeWidth={1.5} />
                Reservar mi hora
              </Button>
            </div>
          </Revelar>
        </Container>
      </section>
    </>
  );
}
