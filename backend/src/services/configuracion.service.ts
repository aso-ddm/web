import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { HttpError } from '../lib/httpError'

// Solo http(s): un "javascript:" en un href sería XSS en Mi panel
export const enlacesInteresSchema = z
  .array(
    z.object({
      label: z.string().trim().min(1).max(100),
      url: z.string().trim().url().max(500).regex(/^https?:\/\//i, 'El enlace debe empezar por http:// o https://'),
    }),
  )
  .max(50)

export class ConfiguracionService {
  constructor(private prisma: PrismaClient) {}

  async getAll() {
    return this.prisma.configuracion.findMany({ orderBy: { clave: 'asc' } })
  }

  async getByKey(clave: string) {
    const config = await this.prisma.configuracion.findUnique({ where: { clave } })
    if (!config) throw new HttpError(404, `Configuración '${clave}' no encontrada`)
    return config
  }

  async update(clave: string, valor: string) {
    const existing = await this.prisma.configuracion.findUnique({ where: { clave } })
    if (!existing) throw new HttpError(404, `Configuración '${clave}' no encontrada`)
    // Un número inválido rompería préstamos y visitas (parseInt → NaN)
    if (existing.tipo === 'numero' && (valor.trim() === '' || !(Number(valor) >= 0))) {
      throw new HttpError(400, 'El valor debe ser un número mayor o igual que 0')
    }
    if (clave === 'enlaces_interes') {
      let json: unknown
      try {
        json = JSON.parse(valor)
      } catch {
        throw new HttpError(400, 'El valor debe ser JSON válido')
      }
      valor = JSON.stringify(enlacesInteresSchema.parse(json))
    }
    return this.prisma.configuracion.update({
      where: { clave },
      data: { valor },
    })
  }
}
