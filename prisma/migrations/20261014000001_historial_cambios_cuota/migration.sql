-- Historial de cambios: también los pasos entre cuota conjunta e individual
ALTER TYPE "TipoCambioEstado" ADD VALUE 'cuota_conjunta';
ALTER TYPE "TipoCambioEstado" ADD VALUE 'cuota_individual';
ALTER TABLE "HistorialEstadoSocio" ADD COLUMN "detalle" TEXT;
