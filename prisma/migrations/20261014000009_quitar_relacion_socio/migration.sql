-- RelacionSocio: la pertenencia a la cuota conjunta ya la da Usuario.solicitud_grupal_id (todos los miembros son iguales)
-- DropForeignKey
ALTER TABLE "RelacionSocio" DROP CONSTRAINT "RelacionSocio_socio_principal_id_fkey";

-- DropForeignKey
ALTER TABLE "RelacionSocio" DROP CONSTRAINT "RelacionSocio_socio_relacionado_id_fkey";

-- DropTable
DROP TABLE "RelacionSocio";

