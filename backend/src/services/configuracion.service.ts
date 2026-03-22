import { PrismaClient } from '@prisma/client'

export class ConfiguracionService {
  constructor(private prisma: PrismaClient) {}

  async getAll() {
    return this.prisma.configuracion.findMany({ orderBy: { clave: 'asc' } })
  }

  async getByKey(clave: string) {
    const config = await this.prisma.configuracion.findUnique({ where: { clave } })
    if (!config) throw new Error(`Configuración '${clave}' no encontrada`)
    return config
  }

  async update(clave: string, valor: string) {
    const existing = await this.prisma.configuracion.findUnique({ where: { clave } })
    if (!existing) throw new Error(`Configuración '${clave}' no encontrada`)
    return this.prisma.configuracion.update({
      where: { clave },
      data: { valor },
    })
  }
}
