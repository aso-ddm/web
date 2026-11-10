-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "baja_programada_at" TIMESTAMP(3),
ADD COLUMN     "baja_programada_juegos" JSONB,
ADD COLUMN     "baja_programada_por_id" TEXT;
