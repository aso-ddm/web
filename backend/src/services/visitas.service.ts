import { PrismaClient } from '@prisma/client'

const normalizarNombre = (s: string) => s.trim().replace(/\s+/g, ' ')

export class VisitasService {
  constructor(private prisma: PrismaClient) {}

  /** Busca visitantes cuyo nombre coincida (para autocompletar) y muestra cuántas visitas tienen.
   *  Agrupa como cuenta `registrar`: "juan pérez" y "Juan Pérez" son el mismo visitante. */
  async buscar(nombre: string) {
    if (nombre.trim().length < 2) return []

    // ponytail: trae todas las visitas que coinciden y agrupa en memoria; groupBy en SQL si crecen mucho
    const visitas = await this.prisma.visita.findMany({
      where: { nombre_completo: { contains: normalizarNombre(nombre), mode: 'insensitive' } },
      orderBy: { fecha_visita: 'desc' },
      select: { nombre_completo: true, fecha_visita: true },
    })

    const grupos = new Map<string, { nombre_completo: string; total_visitas: number; ultima_visita: Date }>()
    for (const v of visitas) {
      const clave = normalizarNombre(v.nombre_completo).toLowerCase()
      const g = grupos.get(clave)
      // Ordenadas por fecha desc: la primera de cada grupo da el nombre y la última visita
      if (g) g.total_visitas++
      else grupos.set(clave, { nombre_completo: v.nombre_completo, total_visitas: 1, ultima_visita: v.fecha_visita })
    }
    return [...grupos.values()]
  }

  /** Registra una visita aplicando la lógica de gratis vs. pago */
  async registrar(data: { nombre_completo: string; socio_registro_id: string }) {
    const [visitas_gratuitas_cfg, precio_cfg] = await Promise.all([
      this.prisma.configuracion.findUnique({ where: { clave: 'visitas_gratuitas' } }),
      this.prisma.configuracion.findUnique({ where: { clave: 'precio_visita_pago' } }),
    ])

    const visitasGratuitas = parseInt(visitas_gratuitas_cfg?.valor ?? '3', 10)
    const precio = parseFloat(precio_cfg?.valor ?? '4')

    // "juan  pérez " y "Juan Pérez" son la misma persona: si no, las visitas gratis se multiplican
    const nombre = normalizarNombre(data.nombre_completo)
    // ponytail: dos registros simultáneos del mismo visitante pueden salir ambos gratis; transacción Serializable si llega a pasar
    const visitasPrevias = await this.prisma.visita.count({
      where: { nombre_completo: { equals: nombre, mode: 'insensitive' } },
    })

    const numeroVisita = visitasPrevias + 1
    const esGratis = visitasPrevias < visitasGratuitas
    const esPago = !esGratis

    return this.prisma.visita.create({
      data: {
        nombre_completo: nombre,
        fecha_visita: new Date(),
        numero_visita: numeroVisita,
        es_pago: esPago,
        importe: esPago ? precio : null,
        socio_registro_id: data.socio_registro_id,
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
