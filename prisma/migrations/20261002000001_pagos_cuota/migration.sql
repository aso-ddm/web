-- Estado mensual de las cuotas. Sin fila = mes sin revisar.
CREATE TYPE "EstadoPago" AS ENUM ('pagado', 'sin_pagar');

CREATE TABLE "PagoCuota" (
    "id" TEXT NOT NULL,
    "socio_id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "estado" "EstadoPago" NOT NULL,
    "revisado_por_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagoCuota_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PagoCuota_mes_check" CHECK ("mes" BETWEEN 1 AND 12)
);

CREATE UNIQUE INDEX "PagoCuota_socio_id_anio_mes_key" ON "PagoCuota"("socio_id", "anio", "mes");

ALTER TABLE "PagoCuota" ADD CONSTRAINT "PagoCuota_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PagoCuota" ADD CONSTRAINT "PagoCuota_revisado_por_id_fkey" FOREIGN KEY ("revisado_por_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
