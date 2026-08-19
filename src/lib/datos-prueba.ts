import type { Service } from '../types';

/**
 * DATOS DE PRUEBA — Goddess Studio.
 *
 * Solo para maquetar el rediseño: precios, duraciones y textos son
 * provisorios y hay que confirmarlos con la clienta. Cuando los servicios
 * reales estén en la base, se borra este archivo y las páginas vuelven a
 * `getServices()`.
 *
 * Están todos juntos acá a propósito: así queda un único lugar que borrar,
 * sin datos falsos dispersos por los componentes.
 */

export const ES_MAQUETA = true;

/** Depósito fijo al reservar, según la definición de negocio. */
export const DEPOSITO_FIJO = 5000;

export const SERVICIOS_PRUEBA: Service[] = [
  {
    id: 'demo-unas-permanente',
    name: 'Esmaltado Permanente',
    description:
      'Manicure completa con esmaltado permanente de larga duración. Incluye limado, cutículas y elección de color.',
    duration_minutes: 90,
    price: 18000,
    deposit_amount: DEPOSITO_FIJO,
    category: 'facial',
    image_url: '/images/g-unas-esmaltado.jpg',
    active: true,
  },
  {
    id: 'demo-unas-acrilicas',
    name: 'Uñas Acrílicas con Diseño',
    description:
      'Extensión en acrílico con la forma y largo que prefieras, más diseño personalizado a elección.',
    duration_minutes: 150,
    price: 32000,
    deposit_amount: DEPOSITO_FIJO,
    category: 'facial',
    image_url: '/images/g-unas-diseno.jpg',
    active: true,
  },
  {
    id: 'demo-pestanas-pelo',
    name: 'Extensión de Pestañas Pelo a Pelo',
    description:
      'Aplicación pelo a pelo para un efecto natural. Se coloca una extensión por cada pestaña propia.',
    duration_minutes: 120,
    price: 25000,
    deposit_amount: DEPOSITO_FIJO,
    category: 'laser',
    image_url: '/images/g-pestanas-extension.jpg',
    active: true,
  },
  {
    id: 'demo-pestanas-lifting',
    name: 'Lifting de Pestañas',
    description:
      'Curvatura y tinte de tus pestañas naturales. Sin extensiones y con una duración de hasta ocho semanas.',
    duration_minutes: 60,
    price: 20000,
    deposit_amount: DEPOSITO_FIJO,
    category: 'laser',
    image_url: '/images/g-pestanas-lifting.jpg',
    active: true,
  },
  {
    id: 'demo-cejas-diseno',
    name: 'Diseño y Laminado de Cejas',
    description:
      'Diseño según la forma de tu rostro, con laminado para fijar y dar volumen. Incluye perfilado y tinte.',
    duration_minutes: 60,
    price: 16000,
    deposit_amount: DEPOSITO_FIJO,
    category: 'course',
    image_url: '/images/g-cejas-diseno.jpg',
    active: true,
  },
];

/** Etiquetas de categoría propias de Goddess (uñas, pestañas, cejas). */
export const CATEGORIAS_GODDESS = [
  { id: 'all', label: 'Todos' },
  { id: 'facial', label: 'Uñas' },
  { id: 'laser', label: 'Pestañas' },
  { id: 'course', label: 'Cejas' },
] as const;
