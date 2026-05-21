-- prisma-migrate-no-transaction

-- 1. Crear enum EstadoSolicitud
CREATE TYPE "EstadoSolicitud" AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- 2. Crear tabla SolicitudGrupal (TEXT para compatibilidad con Usuario.id que es TEXT/cuid)
CREATE TABLE "SolicitudGrupal" (
    "id"         TEXT NOT NULL,
    "titular_id" TEXT NOT NULL,
    "estado"     "EstadoSolicitud" NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitudGrupal_pkey" PRIMARY KEY ("id")
);

-- 3. Índice único en titular_id
CREATE UNIQUE INDEX "SolicitudGrupal_titular_id_key" ON "SolicitudGrupal"("titular_id");

-- 4. FK de SolicitudGrupal.titular_id → Usuario.id
ALTER TABLE "SolicitudGrupal"
    ADD CONSTRAINT "SolicitudGrupal_titular_id_fkey"
    FOREIGN KEY ("titular_id") REFERENCES "Usuario"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. Añadir columna solicitud_grupal_id nullable a Usuario
ALTER TABLE "Usuario"
    ADD COLUMN "solicitud_grupal_id" TEXT;

-- 6. FK de Usuario.solicitud_grupal_id → SolicitudGrupal.id
ALTER TABLE "Usuario"
    ADD CONSTRAINT "Usuario_solicitud_grupal_id_fkey"
    FOREIGN KEY ("solicitud_grupal_id") REFERENCES "SolicitudGrupal"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Añadir valor 'conjunta' al enum TipoCuota existente
ALTER TYPE "TipoCuota" ADD VALUE IF NOT EXISTS 'conjunta';

-- COMMIT implícito necesario antes de usar el nuevo valor del enum
COMMIT;
BEGIN;

-- 8. Migrar datos: pareja y familiar → conjunta
UPDATE "Usuario"
    SET "tipo_cuota" = 'conjunta'
    WHERE "tipo_cuota" IN ('pareja', 'familiar');

-- 9. Recrear enum TipoCuota con solo 'individual' y 'conjunta'
ALTER TYPE "TipoCuota" RENAME TO "TipoCuota_old";
CREATE TYPE "TipoCuota" AS ENUM ('individual', 'conjunta');
ALTER TABLE "Usuario"
    ALTER COLUMN "tipo_cuota" TYPE "TipoCuota"
    USING "tipo_cuota"::text::"TipoCuota";
DROP TYPE "TipoCuota_old";

COMMIT;

-- 10. Añadir valor 'familiar_directo' al enum TipoRelacion existente (fuera de transacción)
ALTER TYPE "TipoRelacion" ADD VALUE IF NOT EXISTS 'familiar_directo';

COMMIT;
BEGIN;

-- 11. Recrear enum TipoRelacion con solo 'pareja' y 'familiar_directo'
ALTER TYPE "TipoRelacion" RENAME TO "TipoRelacion_old";
CREATE TYPE "TipoRelacion" AS ENUM ('pareja', 'familiar_directo');
ALTER TABLE "RelacionSocio"
    ALTER COLUMN "tipo_relacion" TYPE "TipoRelacion"
    USING "tipo_relacion"::text::"TipoRelacion";
DROP TYPE "TipoRelacion_old";

COMMIT;
