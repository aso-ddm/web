-- prisma-migrate-no-transaction

-- ── 1. Juego: renombrar titulo → nombre ──────────────────────────────────────
ALTER TABLE "Juego" RENAME COLUMN "titulo" TO "nombre";

-- ── 2. Eliminar índice viejo ──────────────────────────────────────────────────
DROP INDEX IF EXISTS "Juego_titulo_idx";

-- ── 3. Eliminar columnas eliminadas del schema ────────────────────────────────
ALTER TABLE "Juego"
  DROP COLUMN IF EXISTS "autor",
  DROP COLUMN IF EXISTS "editorial",
  DROP COLUMN IF EXISTS "anio_publicacion",
  DROP COLUMN IF EXISTS "duracion_minutos",
  DROP COLUMN IF EXISTS "edad_recomendada",
  DROP COLUMN IF EXISTS "categoria",
  DROP COLUMN IF EXISTS "foto_url",
  DROP COLUMN IF EXISTS "bgg_id";

-- ── 4. Añadir columnas nuevas ─────────────────────────────────────────────────
ALTER TABLE "Juego"
  ADD COLUMN IF NOT EXISTS "localizacion" TEXT,
  ADD COLUMN IF NOT EXISTS "notas" TEXT;

-- ── 5. propietario TEXT → propietario_id TEXT (FK a Usuario) ─────────────────
-- BD nueva sin datos reales: vaciamos antes de añadir FK
UPDATE "Juego" SET "propietario" = NULL;
ALTER TABLE "Juego" RENAME COLUMN "propietario" TO "propietario_id";
ALTER TABLE "Juego"
  ADD CONSTRAINT "Juego_propietario_id_fkey"
  FOREIGN KEY ("propietario_id") REFERENCES "Usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 6. EstadoJuego: añadir nuevos valores (debe ir fuera de transacción) ──────
ALTER TYPE "EstadoJuego" ADD VALUE IF NOT EXISTS 'en_estanteria';
ALTER TYPE "EstadoJuego" ADD VALUE IF NOT EXISTS 'retirado';

COMMIT;

-- ── 7. Migrar datos existentes ────────────────────────────────────────────────
UPDATE "Juego" SET "estado" = 'en_estanteria' WHERE "estado" = 'disponible';
UPDATE "Juego" SET "estado" = 'retirado'      WHERE "estado" = 'mantenimiento';

-- ── 8. Recrear enum sin valores obsoletos ────────────────────────────────────
ALTER TYPE "EstadoJuego" RENAME TO "EstadoJuego_old";
CREATE TYPE "EstadoJuego" AS ENUM ('en_estanteria', 'prestado', 'retirado');
ALTER TABLE "Juego" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Juego"
  ALTER COLUMN "estado" TYPE "EstadoJuego"
  USING "estado"::text::"EstadoJuego";
ALTER TABLE "Juego" ALTER COLUMN "estado" SET DEFAULT 'en_estanteria'::"EstadoJuego";
DROP TYPE "EstadoJuego_old";

COMMIT;

-- ── 9. Índice nuevo ───────────────────────────────────────────────────────────
CREATE INDEX "Juego_nombre_idx" ON "Juego"("nombre");
