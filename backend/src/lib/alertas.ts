import { Rol, type PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { avisarRol } from './telegram'

// Alertas de Telegram a cargos del club. Cada una se guarda en Configuracion (clave = la de aquí, tipo 'alerta',
// valor JSON { activa, texto }). Sin fila → valores por defecto: la fila se crea al guardar desde Configuración.
// Texto plano: {variable} se sustituye por su valor; lo escribe la directiva y no hay que escapar nada.
export const ALERTAS = {
  alerta_alta: {
    rol: Rol.secretario,
    texto: '📝 Nueva solicitud de alta\n\n{nombre} ({email})\nCuota: {cuota}\n\nRevísala en Directiva → Solicitudes.',
  },
  alerta_llaves: {
    rol: Rol.secretario,
    texto: '🔑 Solicitud de llaves\n\n{nombre} quiere pedir las llaves del club.\nEmail: {email}\nTelegram: {telegram}',
  },
  alerta_baja: {
    rol: Rol.secretario,
    texto: '🚪 Solicitud de baja\n\n{nombre} quiere darse de baja del club.\nCuota: {cuota}\nEmail: {email}\nTelegram: {telegram}',
  },
  alerta_prestamo: {
    rol: Rol.ludotecario,
    texto: '📦 Nuevo préstamo: {socio} se ha llevado «{juego}» ({fecha_limite}).',
  },
  alerta_renovacion: {
    rol: Rol.ludotecario,
    texto: '🔄 Renovación: {socio} ha renovado «{juego}» (renovación {renovaciones}, {fecha_limite}).',
  },
  alerta_devolucion: {
    rol: Rol.ludotecario,
    texto: '✅ Devolución: «{juego}» de {socio} ha vuelto a la estantería.',
  },
} as const

export type ClaveAlerta = keyof typeof ALERTAS

export const esAlerta = (clave: string): clave is ClaveAlerta => clave in ALERTAS

export const alertaSchema = z.object({
  activa: z.boolean(),
  texto: z.string().trim().min(1, 'El mensaje no puede estar vacío').max(1000), // 1024 = máx. del pie de un documento
})

export type Alerta = z.infer<typeof alertaSchema>

export const alertaPorDefecto = (clave: ClaveAlerta): Alerta => ({ activa: true, texto: ALERTAS[clave].texto })

/** Valor guardado de la alerta; si falta o está roto, el de por defecto */
export function leerAlerta(clave: ClaveAlerta, valor: string | undefined): Alerta {
  try {
    return alertaSchema.parse(JSON.parse(valor ?? ''))
  } catch {
    return alertaPorDefecto(clave)
  }
}

export const rellenar = (texto: string, vars: Record<string, string>) =>
  texto.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m)

/**
 * Envía la alerta a los socios activos del cargo con Telegram. Nunca lanza.
 * Devuelve null si está desactivada; si no, si llegó a alguno.
 */
export async function alertar(prisma: PrismaClient, clave: ClaveAlerta, vars: Record<string, string>, archivo?: string) {
  let alerta: Alerta
  try {
    const config = await prisma.configuracion.findUnique({ where: { clave } })
    alerta = leerAlerta(clave, config?.valor)
  } catch (err) {
    console.error(`No se pudo leer la alerta ${clave}:`, err)
    alerta = alertaPorDefecto(clave)
  }
  if (!alerta.activa) return null
  return avisarRol(prisma, ALERTAS[clave].rol, clave, rellenar(alerta.texto, vars), archivo)
}
