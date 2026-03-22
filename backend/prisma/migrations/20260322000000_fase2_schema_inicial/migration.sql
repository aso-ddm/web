-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('presidente', 'secretario', 'tesorero', 'vocal', 'ludotecario', 'socio_basico');

-- CreateEnum
CREATE TYPE "EstadoSocio" AS ENUM ('pendiente', 'activo', 'inactivo', 'baja');

-- CreateEnum
CREATE TYPE "TipoCuota" AS ENUM ('individual', 'pareja', 'familiar');

-- CreateEnum
CREATE TYPE "TipoRelacion" AS ENUM ('pareja', 'hijo', 'padre');

-- CreateEnum
CREATE TYPE "EstadoJuego" AS ENUM ('disponible', 'prestado', 'mantenimiento');

-- CreateEnum
CREATE TYPE "EstadoPrestamo" AS ENUM ('pendiente', 'aprobado', 'rechazado', 'activo', 'devuelto');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "telefono" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "direccion" TEXT,
    "alias_telegram" TEXT,
    "usuario_bgg" TEXT,
    "apodo" TEXT,
    "tipo_cuota" "TipoCuota" NOT NULL DEFAULT 'individual',
    "consentimiento_tiendas" BOOLEAN NOT NULL DEFAULT false,
    "roles" "Rol"[],
    "estado" "EstadoSocio" NOT NULL DEFAULT 'pendiente',
    "fecha_alta" TIMESTAMP(3),
    "fecha_baja" TIMESTAMP(3),
    "tiene_llaves" BOOLEAN NOT NULL DEFAULT false,
    "fecha_solicitud_llaves" TIMESTAMP(3),
    "fecha_aprobacion_llaves" TIMESTAMP(3),
    "aprobado_por_id" TEXT,
    "aprobado_llaves_por_id" TEXT,
    "baja_por_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelacionSocio" (
    "id" TEXT NOT NULL,
    "socio_principal_id" TEXT NOT NULL,
    "socio_relacionado_id" TEXT NOT NULL,
    "tipo_relacion" "TipoRelacion" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelacionSocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Juego" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "autor" TEXT,
    "editorial" TEXT,
    "anio_publicacion" INTEGER,
    "num_jugadores_min" INTEGER,
    "num_jugadores_max" INTEGER,
    "duracion_minutos" INTEGER,
    "edad_recomendada" INTEGER,
    "categoria" TEXT,
    "estado" "EstadoJuego" NOT NULL DEFAULT 'disponible',
    "propietario" TEXT,
    "foto_url" TEXT,
    "bgg_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Juego_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prestamo" (
    "id" TEXT NOT NULL,
    "juego_id" TEXT NOT NULL,
    "socio_id" TEXT NOT NULL,
    "usuario_aprobo_id" TEXT,
    "usuario_confirmo_dev_id" TEXT,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_aprobacion" TIMESTAMP(3),
    "fecha_prestamo" TIMESTAMP(3),
    "fecha_devolucion" TIMESTAMP(3),
    "estado" "EstadoPrestamo" NOT NULL DEFAULT 'pendiente',
    "motivo_rechazo" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prestamo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visita" (
    "id" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "fecha_visita" TIMESTAMP(3) NOT NULL,
    "numero_visita" INTEGER NOT NULL,
    "es_pago" BOOLEAN NOT NULL DEFAULT false,
    "importe" DECIMAL(10,2),
    "socio_registro_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_dni_key" ON "Usuario"("dni");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_estado_idx" ON "Usuario"("estado");

-- CreateIndex
CREATE INDEX "Usuario_dni_idx" ON "Usuario"("dni");

-- CreateIndex
CREATE INDEX "Juego_titulo_idx" ON "Juego"("titulo");

-- CreateIndex
CREATE INDEX "Juego_estado_idx" ON "Juego"("estado");

-- CreateIndex
CREATE INDEX "Prestamo_juego_id_idx" ON "Prestamo"("juego_id");

-- CreateIndex
CREATE INDEX "Prestamo_socio_id_idx" ON "Prestamo"("socio_id");

-- CreateIndex
CREATE INDEX "Prestamo_estado_idx" ON "Prestamo"("estado");

-- CreateIndex
CREATE INDEX "Visita_nombre_completo_idx" ON "Visita"("nombre_completo");

-- CreateIndex
CREATE INDEX "Visita_fecha_visita_idx" ON "Visita"("fecha_visita");

-- CreateIndex
CREATE UNIQUE INDEX "Configuracion_clave_key" ON "Configuracion"("clave");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_aprobado_por_id_fkey" FOREIGN KEY ("aprobado_por_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_aprobado_llaves_por_id_fkey" FOREIGN KEY ("aprobado_llaves_por_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_baja_por_id_fkey" FOREIGN KEY ("baja_por_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelacionSocio" ADD CONSTRAINT "RelacionSocio_socio_principal_id_fkey" FOREIGN KEY ("socio_principal_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelacionSocio" ADD CONSTRAINT "RelacionSocio_socio_relacionado_id_fkey" FOREIGN KEY ("socio_relacionado_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_juego_id_fkey" FOREIGN KEY ("juego_id") REFERENCES "Juego"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_usuario_aprobo_id_fkey" FOREIGN KEY ("usuario_aprobo_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_usuario_confirmo_dev_id_fkey" FOREIGN KEY ("usuario_confirmo_dev_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visita" ADD CONSTRAINT "Visita_socio_registro_id_fkey" FOREIGN KEY ("socio_registro_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

