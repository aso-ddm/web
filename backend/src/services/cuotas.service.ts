import { PrismaClient, EstadoSocio, EstadoPago } from '@prisma/client'
import type { MarcarCuotaInput, AdelantarCuotaInput } from '../schemas/cuota.schema'
import { HttpError } from '../lib/httpError'

export class CuotasService {
  constructor(private prisma: PrismaClient) {}

  // Socios activos con los pagos de `anio` y los impagos de cualquier año (para saber quién es moroso):
  // el histórico completo crece cada año y no hace falta.
  // Cuota conjunta: los pagos son del grupo y todos los miembros los comparten (cuota_id = id del grupo).
  // ponytail: solo activos; los de baja con deuda no aparecen. Añadir filtro si hace falta perseguirla.
  async listar(anio: number) {
    const pagos = {
      where: { OR: [{ anio }, { estado: EstadoPago.sin_pagar }] },
      select: { anio: true, mes: true, estado: true },
    }
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

  // Dónde se apuntan los pagos del socio: en el grupo si es cuota conjunta (vale para todos), si no en el socio
  private async cuotaDe(socioId: string) {
    const socio = await this.prisma.usuario.findUnique({
      where: { id: socioId },
      select: { id: true, solicitud_grupal_id: true },
    })
    if (!socio) throw new HttpError(404, 'Socio no encontrado')
    const grupo_id = socio.solicitud_grupal_id
    return {
      de: grupo_id ? { grupo_id } : { socio_id: socio.id },
      clave: (anio: number, mes: number) => grupo_id
        ? { grupo_id_anio_mes: { grupo_id, anio, mes } }
        : { socio_id_anio_mes: { socio_id: socio.id, anio, mes } },
    }
  }

  /** Marca el estado de un mes; en cuota conjunta se apunta en el grupo y vale para todos sus miembros. */
  async marcar(socioId: string, { anio, mes, estado }: MarcarCuotaInput, porId: string) {
    const { de, clave } = await this.cuotaDe(socioId)
    if (estado === null) {
      await this.prisma.pagoCuota.deleteMany({ where: { ...de, anio, mes } })
    } else {
      await this.prisma.pagoCuota.upsert({
        where: clave(anio, mes),
        create: { ...de, anio, mes, estado, revisado_por_id: porId },
        update: { estado, revisado_por_id: porId },
      })
    }
    return { ...de, anio, mes, estado }
  }

  /** Marca como pagados `meses` meses seguidos desde anio/mes (pago por adelantado), todos o ninguno. */
  async adelantar(socioId: string, { anio, mes, meses }: AdelantarCuotaInput, porId: string) {
    const { de, clave } = await this.cuotaDe(socioId)
    const lista = Array.from({ length: meses }, (_, i) => {
      const m = anio * 12 + (mes - 1) + i
      return { anio: Math.floor(m / 12), mes: (m % 12) + 1 }
    })
    await this.prisma.$transaction(lista.map((p) => this.prisma.pagoCuota.upsert({
      where: clave(p.anio, p.mes),
      create: { ...de, ...p, estado: EstadoPago.pagado, revisado_por_id: porId },
      update: { estado: EstadoPago.pagado, revisado_por_id: porId },
    })))
    return { ...de, meses: lista }
  }
}
