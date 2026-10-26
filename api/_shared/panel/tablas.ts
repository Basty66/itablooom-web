import type { NeonQueryFunction } from '@neondatabase/serverless';

type Sql = NeonQueryFunction<false, false>;

/**
 * Crea las tablas del panel si no existen: llaves de Face ID, desafíos y
 * suscripciones push. Es lo mismo que está al final de migrar.sql.
 *
 * Corre desde el servidor la primera vez que se usan, en vez de exigir que
 * alguien corra la migración a mano con la contraseña de la base: así el
 * despliegue basta. Una vez por instancia de la función —la promesa queda
 * guardada— y solo CREATE TABLE IF NOT EXISTS, que no toca nada existente.
 */
let listas: Promise<void> | null = null;

export function asegurarTablas(sql: Sql): Promise<void> {
  listas ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS admin_llaves (
        id TEXT PRIMARY KEY,
        llave_publica TEXT NOT NULL,
        contador BIGINT NOT NULL DEFAULT 0,
        transportes TEXT[],
        aparato VARCHAR(40),
        creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
        ultimo_uso TIMESTAMPTZ
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS admin_desafios (
        id TEXT PRIMARY KEY,
        desafio TEXT NOT NULL,
        vence_en TIMESTAMPTZ NOT NULL
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS admin_suscripciones (
        endpoint TEXT PRIMARY KEY,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        aparato VARCHAR(40),
        creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
        ultimo_envio TIMESTAMPTZ
      )
    `;
  })().catch((error) => {
    // Si falló (sin conexión, por ejemplo), la próxima petición reintenta.
    listas = null;
    throw error;
  });
  return listas;
}
