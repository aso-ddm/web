-- Tipo de cada juego: juego de mesa o libro/cómic (Ludoteca: pestañas Juegos y Biblioteca).
-- Columnas nuevas con default: lo existente queda como 'juego' y la imagen anterior las ignora.
CREATE TYPE "TipoJuego" AS ENUM ('juego', 'libro');

ALTER TABLE "Juego" ADD COLUMN "tipo" "TipoJuego" NOT NULL DEFAULT 'juego';

ALTER TABLE "SolicitudJuego" ADD COLUMN "tipo" "TipoJuego" NOT NULL DEFAULT 'juego';
