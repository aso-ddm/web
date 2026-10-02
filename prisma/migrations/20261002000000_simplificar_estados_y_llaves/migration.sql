-- Estados de socio: solo pendiente, activo y baja. Los 'inactivo' existentes pasan a 'baja'.
UPDATE "Usuario" SET "estado" = 'baja', "fecha_baja" = COALESCE("fecha_baja", NOW()) WHERE "estado" = 'inactivo';

ALTER TYPE "EstadoSocio" RENAME TO "EstadoSocio_old";
CREATE TYPE "EstadoSocio" AS ENUM ('pendiente', 'activo', 'baja');
ALTER TABLE "Usuario" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Usuario" ALTER COLUMN "estado" TYPE "EstadoSocio" USING ("estado"::text::"EstadoSocio");
ALTER TABLE "Usuario" ALTER COLUMN "estado" SET DEFAULT 'pendiente';
DROP TYPE "EstadoSocio_old";

-- Llaves: solo se registra si el socio las tiene o no (tiene_llaves). Se elimina el flujo de solicitud/aprobación.
ALTER TABLE "Usuario" DROP CONSTRAINT IF EXISTS "Usuario_aprobado_llaves_por_id_fkey";
ALTER TABLE "Usuario" DROP COLUMN "fecha_solicitud_llaves",
                      DROP COLUMN "fecha_aprobacion_llaves",
                      DROP COLUMN "aprobado_llaves_por_id";
