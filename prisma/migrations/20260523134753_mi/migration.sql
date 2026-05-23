/*
  Warnings:

  - You are about to drop the column `fecha_solicitud` on the `Prestamo` table. All the data in the column will be lost.
  - Made the column `fecha_prestamo` on table `Prestamo` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "LogJuego" DROP CONSTRAINT "LogJuego_juego_id_fkey";

-- DropForeignKey
ALTER TABLE "LogJuego" DROP CONSTRAINT "LogJuego_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "SolicitudJuego" DROP CONSTRAINT "SolicitudJuego_juego_id_fkey";

-- DropForeignKey
ALTER TABLE "SolicitudJuego" DROP CONSTRAINT "SolicitudJuego_socio_id_fkey";

-- AlterTable
ALTER TABLE "LogJuego" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Prestamo" DROP COLUMN "fecha_solicitud",
ALTER COLUMN "fecha_prestamo" SET NOT NULL,
ALTER COLUMN "fecha_limite" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SolicitudJuego" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "LogJuego" ADD CONSTRAINT "LogJuego_juego_id_fkey" FOREIGN KEY ("juego_id") REFERENCES "Juego"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogJuego" ADD CONSTRAINT "LogJuego_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudJuego" ADD CONSTRAINT "SolicitudJuego_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudJuego" ADD CONSTRAINT "SolicitudJuego_juego_id_fkey" FOREIGN KEY ("juego_id") REFERENCES "Juego"("id") ON DELETE SET NULL ON UPDATE CASCADE;
