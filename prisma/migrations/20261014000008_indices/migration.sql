-- Índices: FKs sin índice (Postgres no los crea solos) y sobrantes (email/dni ya son únicos; nombre_completo se busca con ILIKE)
-- DropIndex
DROP INDEX "Usuario_email_idx";

-- DropIndex
DROP INDEX "Usuario_dni_idx";

-- DropIndex
DROP INDEX "Prestamo_socio_id_idx";

-- DropIndex
DROP INDEX "Visita_nombre_completo_idx";

-- CreateIndex
CREATE INDEX "Usuario_solicitud_grupal_id_idx" ON "Usuario"("solicitud_grupal_id");

-- CreateIndex
CREATE INDEX "Juego_propietario_id_idx" ON "Juego"("propietario_id");

-- CreateIndex
CREATE INDEX "Prestamo_socio_id_estado_idx" ON "Prestamo"("socio_id", "estado");

