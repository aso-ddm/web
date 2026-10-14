-- Cuota conjunta sin titular: los pagos y el comprobante de alta pasan del titular al grupo

-- Pagos: de socio o de grupo, nunca ambos
ALTER TABLE "PagoCuota" ALTER COLUMN "socio_id" DROP NOT NULL;
ALTER TABLE "PagoCuota" ADD COLUMN "grupo_id" TEXT;
ALTER TABLE "PagoCuota" ADD CONSTRAINT "PagoCuota_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "SolicitudGrupal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "PagoCuota_grupo_id_anio_mes_key" ON "PagoCuota"("grupo_id", "anio", "mes");

UPDATE "PagoCuota" p SET "grupo_id" = g."id", "socio_id" = NULL
FROM "SolicitudGrupal" g WHERE p."socio_id" = g."titular_id";

ALTER TABLE "PagoCuota" ADD CONSTRAINT "PagoCuota_socio_o_grupo_check" CHECK (("socio_id" IS NULL) <> ("grupo_id" IS NULL));

-- Comprobante de alta
ALTER TABLE "SolicitudGrupal" ADD COLUMN "comprobante_transferencia" TEXT;
UPDATE "SolicitudGrupal" g SET "comprobante_transferencia" = u."comprobante_transferencia"
FROM "Usuario" u WHERE u."id" = g."titular_id";
UPDATE "Usuario" u SET "comprobante_transferencia" = NULL
FROM "SolicitudGrupal" g WHERE u."id" = g."titular_id";

-- Fuera el titular
ALTER TABLE "SolicitudGrupal" DROP CONSTRAINT "SolicitudGrupal_titular_id_fkey";
DROP INDEX "SolicitudGrupal_titular_id_key";
ALTER TABLE "SolicitudGrupal" DROP COLUMN "titular_id";
