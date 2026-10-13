-- Historial de altas y bajas de socios
CREATE TYPE "TipoCambioEstado" AS ENUM ('alta', 'baja');

CREATE TABLE "HistorialEstadoSocio" (
    "id" TEXT NOT NULL,
    "socio_id" TEXT NOT NULL,
    "tipo" "TipoCambioEstado" NOT NULL,
    "por_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialEstadoSocio_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HistorialEstadoSocio_socio_id_idx" ON "HistorialEstadoSocio"("socio_id");

ALTER TABLE "HistorialEstadoSocio" ADD CONSTRAINT "HistorialEstadoSocio_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HistorialEstadoSocio" ADD CONSTRAINT "HistorialEstadoSocio_por_id_fkey" FOREIGN KEY ("por_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rellenar con lo que se sabe: el alta original y, si sigue de baja, la última baja (las intermedias se perdieron)
INSERT INTO "HistorialEstadoSocio" ("id", "socio_id", "tipo", "por_id", "created_at")
SELECT gen_random_uuid()::text, "id", 'alta', "aprobado_por_id", "fecha_alta" FROM "Usuario" WHERE "fecha_alta" IS NOT NULL;
INSERT INTO "HistorialEstadoSocio" ("id", "socio_id", "tipo", "por_id", "created_at")
SELECT gen_random_uuid()::text, "id", 'baja', "baja_por_id", "fecha_baja" FROM "Usuario" WHERE "fecha_alta" IS NOT NULL AND "fecha_baja" IS NOT NULL;
