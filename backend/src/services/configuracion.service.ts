import { PrismaClient } from '@prisma/client'
import { HttpError } from '../lib/httpError'

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
    if (!existing) throw new HttpError(404, `Configuración '${clave}' no encontrada`)
    // Un número inválido rompería préstamos y visitas (parseInt → NaN)
    if (existing.tipo === 'numero' && (valor.trim() === '' || !(Number(valor) >= 0))) {
      throw new HttpError(400, 'El valor debe ser un número mayor o igual que 0')
    }
    return this.prisma.configuracion.update({
      where: { clave },
      data: { valor },
    })
  }
}
