import { PrismaClient, EstadoSocio } from '@prisma/client'
import type { MarcarCuotaInput } from '../schemas/cuota.schema'
import { HttpError } from '../lib/httpError'

export class CuotasService {
  constructor(private prisma: PrismaClient) {}

  // Socios activos con sus pagos.
  // Cuota conjunta: los pagos son del grupo y todos los miembros los comparten (cuota_id = id del grupo).
  // ponytail: solo activos; los de baja con deuda no aparecen. Añadir filtro si hace falta perseguirla.
  async listar() {
    const pagos = { select: { anio: true, mes: true, estado: true } }
    const socios = await this.prisma.usuario.findMany({
      where: { estado: EstadoSocio.activo, fecha_alta: { not: null } },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        apodo: true,
        fecha_alta: true,
        pagos_cuota: pagos,
        solicitud_grupal: { select: { id: true, pagos } },
      },
      orderBy: [{ nombre: 'asc' }, { apellidos: 'asc' }],
    })
    return socios.map(({ solicitud_grupal: grupo, ...s }) => ({
      ...s,
      conjunta: !!grupo,
      cuota_id: grupo?.id ?? s.id,
      pagos_cuota: grupo?.pagos ?? s.pagos_cuota,
    }))
  }

  /** Marca el estado de un mes; en cuota conjunta se apunta en el grupo y vale para todos sus miembros. */
  async marcar(socioId: string, { anio, mes, estado }: MarcarCuotaInput, porId: string) {
    const socio = await this.prisma.usuario.findUnique({
      where: { id: socioId },
      select: { id: true, solicitud_grupal_id: true },
    })
    if (!socio) throw new HttpError(404, 'Socio no encontrado')

    const grupo_id = socio.solicitud_grupal_id
    const de = grupo_id ? { grupo_id } : { socio_id: socio.id }
    if (estado === null) {
      await this.prisma.pagoCuota.deleteMany({ where: { ...de, anio, mes } })
    } else {
      await this.prisma.pagoCuota.upsert({
        where: grupo_id
          ? { grupo_id_anio_mes: { grupo_id, anio, mes } }
          : { socio_id_anio_mes: { socio_id: socio.id, anio, mes } },
        create: { ...de, anio, mes, estado, revisado_por_id: porId },
        update: { estado, revisado_por_id: porId },
      })
    }
    return { ...de, anio, mes, estado }
  }
}
