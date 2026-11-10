-- dias_prestamo = 0 o dias_renovacion = 0: el préstamo no tiene fecha límite
ALTER TABLE "Prestamo" ALTER COLUMN "fecha_limite" DROP NOT NULL;
