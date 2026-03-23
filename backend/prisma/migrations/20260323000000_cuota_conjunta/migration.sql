-- 1. Crear enum EstadoSolicitud
CREATE TYPE "EstadoSolicitud" AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- 2. Crear tabla SolicitudGrupal
CREATE TABLE "SolicitudGrupal" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "titular_id" UUID UNIQUE NOT NULL,
    "estado"     "EstadoSolicitud" NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. FK de SolicitudGrupal.titular_id → Usuario.id
ALTER TABLE "SolicitudGrupal"
    ADD CONSTRAINT "SolicitudGrupal_titular_id_fkey"
    FOREIGN KEY ("titular_id") REFERENCES "Usuario"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Añadir columna solicitud_grupal_id nullable a Usuario con FK → SolicitudGrupal.id
ALTER TABLE "Usuario"
    ADD COLUMN "solicitud_grupal_id" UUID;

ALTER TABLE "Usuario"
    ADD CONSTRAINT "Usuario_solicitud_grupal_id_fkey"
    FOREIGN KEY ("solicitud_grupal_id") REFERENCES "SolicitudGrupal"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Añadir valor 'conjunta' al enum TipoCuota existente
ALTER TYPE "TipoCuota" ADD VALUE 'conjunta';

-- 6. Migrar datos: pareja y familiar → conjunta
UPDATE "Usuario"
    SET "tipo_cuota" = 'conjunta'
    WHERE "tipo_cuota" IN ('pareja', 'familiar');

-- 7. Recrear enum TipoCuota con solo 'individual' y 'conjunta'
ALTER TYPE "TipoCuota" RENAME TO "TipoCuota_old";
CREATE TYPE "TipoCuota" AS ENUM ('individual', 'conjunta');
ALTER TABLE "Usuario"
    ALTER COLUMN "tipo_cuota" TYPE "TipoCuota"
    USING "tipo_cuota"::text::"TipoCuota";
DROP TYPE "TipoCuota_old";

-- 8. Añadir valor 'familiar_directo' al enum TipoRelacion existente
ALTER TYPE "TipoRelacion" ADD VALUE 'familiar_directo';

-- 9. Recrear enum TipoRelacion con solo 'pareja' y 'familiar_directo'
ALTER TYPE "TipoRelacion" RENAME TO "TipoRelacion_old";
CREATE TYPE "TipoRelacion" AS ENUM ('pareja', 'familiar_directo');
ALTER TABLE "RelacionSocio"
    ALTER COLUMN "tipo_relacion" TYPE "TipoRelacion"
    USING "tipo_relacion"::text::"TipoRelacion";
DROP TYPE "TipoRelacion_old";
