/**
 * Carga el catálogo real de Goddess Studio: la lista de precios que pasó
 * Ignacia, con sus descripciones.
 *
 * Los servicios viejos se desactivan, nunca se borran. Hay reservas que
 * apuntan a ellos —siete al esmaltado, cinco a cejas— y borrar la fila
 * dejaría esas citas sin nombre ni precio en el historial y en las finanzas.
 * Desactivado significa que no aparece para reservar, pero lo que ya pasó
 * sigue contando su propia historia.
 *
 * Los servicios se identifican por nombre: correrlo dos veces actualiza los
 * mismos, no los duplica.
 *
 *   npm run db:catalogo              muestra qué cambiaría, sin tocar nada
 *   npm run db:catalogo -- --aplicar escribe los cambios
 */
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL. Corre el script con: npm run db:catalogo');
  process.exit(1);
}
const sql = neon(url);

/*
 * Las claves de `category` siguen siendo las heredadas del sitio anterior
 * (facial/laser/course) porque así está la columna y así las mapea el resto
 * del código a Uñas/Pestañas/Cejas.
 */
const UNAS = 'facial';
const PESTANAS = 'laser';
const CEJAS = 'course';

interface Entrada {
  nombre: string;
  descripcion: string;
  categoria: string;
  /** Valor del servicio. En los de uñas es el piso de un rango. */
  precio: number;
  /** Techo del rango, cuando el valor depende del largo y el diseño. */
  precioMax?: number;
  /** Minutos de sillón. PROVISIONAL: los debe confirmar Ignacia. */
  minutos: number;
  imagen: string;
  /**
   * Va sumado a otro servicio y no como hora propia.
   *
   * El visajismo es diseño de cejas que acompaña, nunca la visita completa.
   * Además su valor queda por debajo del abono de $10.000, así que reservarlo
   * suelto cobraría más por adelantado que lo que cuesta el servicio.
   */
  complemento?: boolean;
}

const CATALOGO: Entrada[] = [
  // ---- Pestañas ----
  {
    nombre: 'Pestañas Clásicas',
    descripcion:
      'Una extensión por cada pestaña natural para lograr una mirada definida, elegante y natural.',
    categoria: PESTANAS,
    precio: 27000,
    minutos: 120,
    imagen: '/images/g-pestanas-extension.jpg',
  },
  {
    nombre: 'Efecto Rímel',
    descripcion:
      'Mirada definida e intensa, con un acabado que recrea la máscara de pestañas, pero más duradero y sofisticado.',
    categoria: PESTANAS,
    precio: 28000,
    minutos: 120,
    imagen: '/images/g-pestanas-lifting.jpg',
  },
  {
    nombre: 'Pestañas Wispy',
    descripcion:
      'Pestañas con diferentes longitudes que crean un efecto despeinado, ligero y muy moderno.',
    categoria: PESTANAS,
    precio: 30000,
    minutos: 135,
    imagen: '/images/g-pestanas-extension.jpg',
  },
  {
    nombre: 'Fibras Tecnológicas (2D a 4D)',
    descripcion:
      'Mayor volumen, definición y duración con fibras ultraligeras que se adaptan perfectamente a tus pestañas naturales.',
    categoria: PESTANAS,
    precio: 33000,
    minutos: 150,
    imagen: '/images/g-pestanas-lifting.jpg',
  },
  {
    nombre: 'Volumen 5D',
    descripcion:
      'Máxima densidad y definición para una mirada intensa y sofisticada, con abanicos ligeros que aportan un efecto glamuroso sin perder elegancia.',
    categoria: PESTANAS,
    precio: 35000,
    minutos: 150,
    imagen: '/images/g-pestanas-extension.jpg',
  },

  // ---- Cejas ----
  {
    nombre: 'Visajismo',
    descripcion:
      'Diseño personalizado según la forma de tu rostro y tus facciones, para lograr unas cejas armónicas y favorecedoras.',
    categoria: CEJAS,
    precio: 8000,
    minutos: 30,
    imagen: '/images/g-cejas-diseno.jpg',
    complemento: true,
  },
  {
    nombre: 'Visajismo + Henna',
    descripcion:
      'Diseño personalizado según tu rostro, acompañado de henna para definir, rellenar y dar mayor intensidad a tus cejas.',
    categoria: CEJAS,
    precio: 12000,
    minutos: 45,
    imagen: '/images/g-cejas-diseno.jpg',
    complemento: true,
  },
  {
    nombre: 'Laminado de Cejas',
    descripcion:
      'Peina y fija tus cejas para lograr un efecto más ordenado, definido y natural.',
    categoria: CEJAS,
    precio: 18000,
    minutos: 60,
    imagen: '/images/g-cejas-diseno.jpg',
  },

  // ---- Uñas: el valor depende del largo y del diseño ----
  {
    nombre: 'Esmaltado',
    descripcion:
      'Color y brillo de larga duración para unas uñas impecables, prolijas y elegantes.',
    categoria: UNAS,
    precio: 15000,
    precioMax: 20000,
    minutos: 90,
    imagen: '/images/g-unas-esmaltado.jpg',
  },
  {
    nombre: 'Soft Gel',
    descripcion:
      'Extensiones de uñas ligeras y resistentes que aportan longitud y una forma perfecta, con un acabado natural y elegante.',
    categoria: UNAS,
    precio: 22000,
    precioMax: 32000,
    minutos: 120,
    imagen: '/images/g-unas-color.jpg',
  },
  {
    nombre: 'Builder Gel',
    descripcion:
      'Gel constructor que aporta resistencia y estructura a tus uñas naturales, permitiendo reforzarlas y darles un acabado prolijo y duradero.',
    categoria: UNAS,
    precio: 25000,
    precioMax: 35000,
    minutos: 135,
    imagen: '/images/g-unas-premium.jpg',
  },

  /*
   * Retiros. Solo van los que se piden sueltos: el retiro que acompaña a un
   * servicio nuevo cuesta $3.000 y se cobra junto con ese servicio, así que
   * como hora aparte no tiene sentido —y agendarlo por su cuenta ocuparía un
   * bloque que en realidad no existe.
   */
  {
    nombre: 'Retiro de Uñas',
    descripcion:
      'Retiro completo del sistema anterior, cuidando la uña natural. Si lo tomas junto con un servicio nuevo, el retiro vale $3.000.',
    categoria: UNAS,
    precio: 7000,
    minutos: 30,
    imagen: '/images/g-unas-diseno.jpg',
  },
  {
    nombre: 'Retiro de Pestañas',
    descripcion:
      'Retiro de las extensiones sin dañar la pestaña natural. Si lo tomas junto con un servicio nuevo, el retiro vale $3.000.',
    categoria: PESTANAS,
    precio: 5000,
    minutos: 30,
    imagen: '/images/g-pestanas-lifting.jpg',
  },
];

/** Abono de reserva. */
const ABONO = 10000;

/**
 * Cuánto se pide por adelantado para este servicio.
 *
 * Nunca más de lo que vale: los retiros cuestan $5.000 y $7.000, por debajo
 * del abono, así que ahí no hay abono que valga —se paga el total y no queda
 * saldo. Con el abono fijo, un retiro de $5.000 habría pedido $10.000 por
 * adelantado, o sea el doble de su precio.
 */
function abonoDe(precio: number): number {
  return Math.min(ABONO, precio);
}

async function main() {
  const aplicar = process.argv.includes('--aplicar');
  const nombres = CATALOGO.map((s) => s.nombre);

  if (aplicar) {
    await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS price_max INTEGER`;
    await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS es_complemento BOOLEAN NOT NULL DEFAULT false`;
    console.log('✓ columnas price_max y es_complemento listas\n');
  } else {
    console.log('(en modo aplicar se agregarían las columnas price_max y es_complemento)\n');
  }

  // ---- Altas y actualizaciones ----
  for (const s of CATALOGO) {
    const [existente] = (await sql`
      SELECT id, price, duration_minutes, active FROM services WHERE name = ${s.nombre}
    `) as any[];

    const rango = (s.precioMax ? `$${s.precio}–$${s.precioMax}` : `$${s.precio}`) + (s.complemento ? ' [complemento]' : '');
    if (existente) {
      console.log(`${aplicar ? '✓' : '→'} actualiza  ${s.nombre.padEnd(32)} ${rango}  ${s.minutos}min`);
      if (aplicar) {
        await sql`
          UPDATE services SET
            description = ${s.descripcion}, category = ${s.categoria},
            price = ${s.precio}, price_max = ${s.precioMax ?? null},
            duration_minutes = ${s.minutos}, deposit_amount = ${abonoDe(s.precio)},
            image_url = ${s.imagen}, es_complemento = ${s.complemento ?? false}, active = true
          WHERE id = ${existente.id}`;
      }
    } else {
      console.log(`${aplicar ? '✓' : '→'} crea       ${s.nombre.padEnd(32)} ${rango}  ${s.minutos}min`);
      if (aplicar) {
        await sql`
          INSERT INTO services (name, description, duration_minutes, price, price_max, deposit_amount, category, image_url, es_complemento, active)
          VALUES (${s.nombre}, ${s.descripcion}, ${s.minutos}, ${s.precio}, ${s.precioMax ?? null},
                  ${abonoDe(s.precio)}, ${s.categoria}, ${s.imagen}, ${s.complemento ?? false}, true)`;
      }
    }
  }

  // ---- Bajas: se desactivan, jamás se borran ----
  const sobrantes = (await sql`
    SELECT s.id, s.name, COUNT(b.id)::int AS reservas
    FROM services s LEFT JOIN bookings b ON b.service_id = s.id
    WHERE s.active = true AND NOT (s.name = ANY(${nombres}))
    GROUP BY s.id, s.name ORDER BY s.name
  `) as any[];

  if (sobrantes.length) {
    console.log('');
    for (const v of sobrantes) {
      console.log(
        `${aplicar ? '✓' : '→'} desactiva  ${String(v.name).padEnd(32)} (${v.reservas} reserva${v.reservas === 1 ? '' : 's'} en el historial)`
      );
      if (aplicar) await sql`UPDATE services SET active = false WHERE id = ${v.id}`;
    }
  }

  if (!aplicar) console.log('\nNada se modificó. Para escribir: npm run db:catalogo -- --aplicar');
}

main().catch((e) => {
  console.error('No se pudo cargar el catálogo:', e);
  process.exit(1);
});
