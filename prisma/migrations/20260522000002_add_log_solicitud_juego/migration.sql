-- ── 1. Enums nuevos ───────────────────────────────────────────────────────────
CREATE TYPE "TipoLogJuego" AS ENUM (
  'donado',
  'retirado',
  'prestamo_activo',
  'prestamo_devuelto',
  'nota_manual'
);

CREATE TYPE "EstadoSolicitudJuego" AS ENUM (
  'pendiente',
  'aprobada',
  'rechazada'
);

-- ── 2. Tabla LogJuego ─────────────────────────────────────────────────────────
CREATE TABLE "LogJuego" (
  "id"         TEXT NOT NULL,
  "juego_id"   TEXT NOT NULL,
  "tipo"       "TipoLogJuego" NOT NULL,
  "texto"      TEXT NOT NULL,
  "usuario_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "LogJuego_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LogJuego_juego_id_fkey"
    FOREIGN KEY ("juego_id") REFERENCES "Juego"("id") ON DELETE CASCADE,
  CONSTRAINT "LogJuego_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL
);

CREATE INDEX "LogJuego_juego_id_idx"    ON "LogJuego"("juego_id");
CREATE INDEX "LogJuego_created_at_idx"  ON "LogJuego"("created_at");

-- ── 3. Tabla SolicitudJuego ───────────────────────────────────────────────────
CREATE TABLE "SolicitudJuego" (
  "id"             TEXT NOT NULL,
  "socio_id"       TEXT NOT NULL,
  "nombre"         TEXT NOT NULL,
  "notas"          TEXT,
  "estado"         "EstadoSolicitudJuego" NOT NULL DEFAULT 'pendiente',
  "motivo_rechazo" TEXT,
  "juego_id"       TEXT,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "SolicitudJuego_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SolicitudJuego_socio_id_fkey"
    FOREIGN KEY ("socio_id") REFERENCES "Usuario"("id"),
  CONSTRAINT "SolicitudJuego_juego_id_fkey"
    FOREIGN KEY ("juego_id") REFERENCES "Juego"("id") ON DELETE SET NULL
);

CREATE INDEX "SolicitudJuego_estado_idx"    ON "SolicitudJuego"("estado");
CREATE INDEX "SolicitudJuego_socio_id_idx"  ON "SolicitudJuego"("socio_id");
