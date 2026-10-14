import crypto from 'node:crypto'
import { EstadoSocio, type PrismaClient } from '@prisma/client'
import { HttpError } from '../lib/httpError'
import { igualesSeguro } from '../lib/seguridad'

// Corto: una captura del QR deja de servir enseguida. El Dashboard lo renueva antes de que caduque
export const CARNET_VIGENCIA_MS = 5 * 60 * 1000

// Prefijo propio en la firma: el token del carnet no vale como token de sesión ni al revés
const firmar = (cuerpo: string) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET ?? '').update(`carnet:${cuerpo}`).digest('base64url')

/**
 * Carnet digital para las tiendas colaboradoras: el socio enseña un QR y la tienda, sin cuenta, ve solo
 * nombre y apellidos (lo que promete /rgpd) si es socio activo y aceptó ceder sus datos.
 */
export class CarnetService {
  constructor(private db: PrismaClient) {}

  async emitir(usuarioId: string) {
    const usuario = await this.db.usuario.findUnique({
      where: { id: usuarioId },
      select: { consentimiento_tiendas: true },
    })
    if (!usuario?.consentimiento_tiendas) {
      throw new HttpError(403, 'No has dado el consentimiento para compartir tus datos con las tiendas')
    }
    const expira = Date.now() + CARNET_VIGENCIA_MS
    const cuerpo = `${usuarioId}.${expira}`
    return { token: `${cuerpo}.${firmar(cuerpo)}`, expira: new Date(expira).toISOString() }
  }

  // Firma mala, caducado, baja o sin consentimiento: la misma respuesta, no revela cuál de ellas
  async verificar(token: string) {
    const [id, expira, firma] = token.split('.')
    const valido = !!id && !!firma && Number(expira) > Date.now() && igualesSeguro(firma, firmar(`${id}.${expira}`))
    const usuario = valido
      ? await this.db.usuario.findUnique({
          where: { id },
          select: { nombre: true, apellidos: true, estado: true, consentimiento_tiendas: true },
        })
      : null
    if (!usuario || usuario.estado !== EstadoSocio.activo || !usuario.consentimiento_tiendas) {
      throw new HttpError(404, 'Carnet no válido o caducado')
    }
    return { nombre: usuario.nombre, apellidos: usuario.apellidos, verificado_en: new Date().toISOString() }
  }
}
