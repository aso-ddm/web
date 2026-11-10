-- Fecha de cada renovación, para el historial de préstamos
ALTER TABLE "Prestamo" ADD COLUMN "fechas_renovacion" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[];
