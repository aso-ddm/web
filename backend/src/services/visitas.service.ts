import { PrismaClient } from '@prisma/client'

export class VisitasService {
  constructor(private prisma: PrismaClient) {}

  /** Busca visitantes cuyo nombre coincida (para autocompletar) y muestra cuántas visitas tienen */
  async buscar(nombre: string) {
    if (nombre.trim().length < 2) return []

    // Obtener registros agrupados por nombre_completo
    const visitas = await this.prisma.visita.findMany({
      where: { nombre_completo: { contains: nombre, mode: 'insensitive' } },
      orderBy: { fecha_visita: 'desc' },
      distinct: ['nombre_completo'],
      select: { nombre_completo: true },
    })

    // Para cada nombre único, contar el total de visitas
    const resultados = await Promise.all(
      visitas.map(async (v) => {
        const total = await this.prisma.visita.count({
          where: { nombre_completo: v.nombre_completo },
        })
        const ultima = await this.prisma.visita.findFirst({
          where: { nombre_completo: v.nombre_completo },
          orderBy: { fecha_visita: 'desc' },
          select: { fecha_visita: true, es_pago: true },
        })
        return { nombre_completo: v.nombre_completo, total_visitas: total, ultima_visita: ultima?.fecha_visita ?? null }
      }),
    )

    return resultados
  }

  /** Registra una visita aplicando la lógica de gratis vs. pago */
  async registrar(data: { nombre_completo: string; socio_registro_id: string }) {
    const [visitas_gratuitas_cfg, precio_cfg] = await Promise.all([
      this.prisma.configuracion.findUnique({ where: { clave: 'visitas_gratuitas' } }),
      this.prisma.configuracion.findUnique({ where: { clave: 'precio_visita_pago' } }),
    ])

    const visitasGratuitas = parseInt(visitas_gratuitas_cfg?.valor ?? '3', 10)
    const precio = parseFloat(precio_cfg?.valor ?? '4')

    const visitasPrevias = await this.prisma.visita.count({
      where: { nombre_completo: data.nombre_completo },
    })

    const numeroVisita = visitasPrevias + 1
    const esGratis = visitasPrevias < visitasGratuitas
    const esPago = !esGratis

    return this.prisma.visita.create({
      data: {
        nombre_completo: data.nombre_completo,
        fecha_visita: new Date(),
        numero_visita: numeroVisita,
        es_pago: esPago,
        importe: esPago ? precio : null,
        socio_registro_id: data.socio_registro_id,
      },
    })
  }

  /** Historial reciente de visitas (para el panel de directiva) */
  async getRecientes(limit = 50) {
    return this.prisma.visita.findMany({
      orderBy: { fecha_visita: 'desc' },
      take: limit,
      include: {
        socio_registro: { select: { id: true, nombre: true, apellidos: true } },
      },
    })
  }

  async getAll(filtros: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = filtros
    const skip = (page - 1) * limit
    const where = search
      ? { nombre_completo: { contains: search, mode: 'insensitive' as const } }
      : {}

    const [visitas, total] = await Promise.all([
      this.prisma.visita.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha_visita: 'desc' },
        include: { socio_registro: { select: { id: true, nombre: true, apellidos: true } } },
      }),
      this.prisma.visita.count({ where }),
    ])

    return { data: visitas, total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
