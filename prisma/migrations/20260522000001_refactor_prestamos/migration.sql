-- prisma-migrate-no-transaction

-- ── 1. Eliminar columnas del flujo de aprobación ──────────────────────────────
ALTER TABLE "Prestamo"
  DROP COLUMN IF EXISTS "usuario_aprobo_id",
  DROP COLUMN IF EXISTS "fecha_aprobacion",
  DROP COLUMN IF EXISTS "motivo_rechazo";

-- ── 2. fecha_solicitud → renombrar a fecha_prestamo (si aún existe como solicitud) ──
-- (En schema anterior ya era fecha_solicitud; ahora es fecha_prestamo)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Prestamo' AND column_name = 'fecha_solicitud'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Prestamo' AND column_name = 'fecha_prestamo'
  ) THEN
    ALTER TABLE "Prestamo" RENAME COLUMN "fecha_solicitud" TO "fecha_prestamo";
  END IF;
END $$;

-- Asegurarse de que fecha_prestamo tenga default now()
ALTER TABLE "Prestamo"
  ALTER COLUMN "fecha_prestamo" SET DEFAULT now();

-- ── 3. Añadir nuevas columnas ─────────────────────────────────────────────────
ALTER TABLE "Prestamo"
  ADD COLUMN IF NOT EXISTS "fecha_limite" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "renovaciones" INTEGER NOT NULL DEFAULT 0;

-- Rellenar fecha_limite en registros existentes (14 días desde fecha_prestamo)
UPDATE "Prestamo"
  SET "fecha_limite" = "fecha_prestamo" + INTERVAL '14 days'
  WHERE "fecha_limite" IS NULL;

-- Hacer fecha_limite NOT NULL ahora que todos tienen valor
ALTER TABLE "Prestamo"
  ALTER COLUMN "fecha_limite" SET NOT NULL;

-- ── 4. Migrar estados obsoletos → activo/devuelto ─────────────────────────────
UPDATE "Prestamo" SET "estado" = 'activo'   WHERE "estado" IN ('pendiente', 'aprobado');
UPDATE "Prestamo" SET "estado" = 'devuelto' WHERE "estado" = 'rechazado';

-- ── 5. Recrear enum EstadoPrestamo sin valores obsoletos ──────────────────────
ALTER TYPE "EstadoPrestamo" RENAME TO "EstadoPrestamo_old";
CREATE TYPE "EstadoPrestamo" AS ENUM ('activo', 'devuelto');
ALTER TABLE "Prestamo" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Prestamo"
  ALTER COLUMN "estado" TYPE "EstadoPrestamo"
  USING "estado"::text::"EstadoPrestamo";
ALTER TABLE "Prestamo"
  ALTER COLUMN "estado" SET DEFAULT 'activo'::"EstadoPrestamo";
DROP TYPE "EstadoPrestamo_old";

COMMIT;

-- ── 6. Índice en fecha_limite (para cron de avisos) ───────────────────────────
CREATE INDEX IF NOT EXISTS "Prestamo_fecha_limite_idx" ON "Prestamo"("fecha_limite");
