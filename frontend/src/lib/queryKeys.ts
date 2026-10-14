import type { QueryClient } from '@tanstack/react-query'

/**
 * Query keys centralizadas: usar siempre QK en useQuery, setQueryData e invalidaciones (nunca arrays a mano).
 * Las funciones devuelven la clave con sus filtros; las constantes son la raíz, que también sirve de prefijo
 * para invalidar todas sus variantes.
 */
export const QK = {
  // Auth / usuario actual
  ME: ['me'] as const,
  MI_SOLICITUD: ['mi-solicitud'] as const,

  // Juegos: todo cuelga de ['juegos'], así una invalidación cubre catálogo, gestión, ludoteca y logs
  JUEGOS: ['juegos'] as const,
  JUEGOS_GESTION: (search: string, estado: string) => ['juegos', 'gestion', search, estado] as const,
  JUEGOS_CATALOGO: (search: string) => ['juegos', 'catalogo', search] as const, // área socios – PrestamosPage
  LUDOTECA: (search: string, estado: string) => ['juegos', 'ludoteca', search, estado] as const, // área socios – LudotecaPage
  LOGS_JUEGO: (id: string) => ['juegos', 'logs', id] as const,
  LOGS_JUEGO_ALL: ['juegos', 'logs-todos'] as const,
  LOGS_JUEGO_ALL_PAGINA: (page: number) => ['juegos', 'logs-todos', page] as const,
  SOLICITUDES_JUEGO_PENDIENTES: ['solicitudes-juego-pendientes'] as const,
  MIS_SOLICITUDES_JUEGO: ['mis-solicitudes-juego'] as const,

  // Préstamos
  MIS_PRESTAMOS: ['mis-prestamos'] as const,
  MIS_PRESTAMOS_ACTIVOS: ['mis-prestamos', 'activos'] as const,
  MIS_PRESTAMOS_HISTORIAL: ['mis-prestamos', 'historial'] as const,
  MIS_PRESTAMOS_RECIENTES: ['mis-prestamos', 'recientes'] as const,
  PRESTAMOS_GESTION: ['prestamos-gestion'] as const,
  PRESTAMOS_GESTION_ESTADO: (estado: 'activo' | 'devuelto') => ['prestamos-gestion', estado] as const,

  // Socios
  SOCIOS_GESTION: ['socios-gestion'] as const,
  SOCIOS_GESTION_LISTA: (search: string, estado: string, page: number) => ['socios-gestion', search, estado, page] as const,
  SOCIO: (id: string) => ['socio', id] as const, // ficha
  SOCIOS_LLAVES: ['socios-llaves'] as const,
  SOCIOS_OPCIONES: ['socios-opciones'] as const,
  SOCIOS_DESTINATARIOS: ['socios-destinatarios'] as const,
  // El backend emite 'pendientes' por SSE (SolicitudesPage invalida [evento]): no cambiar
  PENDIENTES: ['pendientes'] as const,
  CUOTAS: ['cuotas'] as const,
  CUOTAS_ANIO: (anio: number) => ['cuotas', anio] as const,

  // Admin
  ADMIN_USUARIOS: ['admin-usuarios'] as const,
  ADMIN_USUARIOS_LISTA: (search: string, estado: string, page: number) => ['admin-usuarios', search, estado, page] as const,
  TELEGRAM_ESTADO: ['telegram', 'estado'] as const,
  TELEGRAM_LOGS: ['telegram', 'logs'] as const,
  TELEGRAM_LOGS_FILTRO: (filtros: object) => ['telegram', 'logs', filtros] as const,

  // Configuración
  CONFIGURACION: ['configuracion'] as const, // listado completo (directiva)
  CONFIG: (clave: string) => ['config', clave] as const, // una clave (público); siempre la respuesta cruda

  // Visitas
  VISITAS: ['visitas-listado'] as const,
  VISITAS_LISTA: (search: string) => ['visitas-listado', search] as const,
  VISITAS_BUSCAR: ['visitas-buscar'] as const,
  VISITAS_BUSCAR_NOMBRE: (nombre: string) => ['visitas-buscar', nombre] as const,
} as const

/**
 * Invalida TODAS las queries del catálogo de juegos.
 * Llamar tras cualquier operación que cambie el estado o disponibilidad de un juego:
 * crear, editar, retirar, reactivar, eliminar, prestar, devolver. Incluye el historial: esas operaciones
 * generan logs (prestamo_activo, prestamo_devuelto, retirado...).
 */
export function invalidarJuegos(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: QK.JUEGOS })
}

/**
 * Invalida todas las queries de préstamos (propios y de gestión).
 * Llamar tras solicitar, renovar, devolver o aprobar un préstamo.
 */
export function invalidarPrestamos(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: QK.MIS_PRESTAMOS })
  qc.invalidateQueries({ queryKey: QK.PRESTAMOS_GESTION })
}

/**
 * Invalida todas las vistas que listan socios.
 * Llamar tras aprobar, rechazar, dar de baja, reactivar, cambiar roles o llaves.
 * Incluye ['me']: la directiva puede cambiarse sus propias llaves.
 */
export function invalidarSocios(qc: QueryClient) {
  for (const queryKey of [
    QK.PENDIENTES, QK.SOCIOS_GESTION, ['socio'], QK.SOCIOS_LLAVES,
    QK.SOCIOS_OPCIONES, QK.SOCIOS_DESTINATARIOS, QK.CUOTAS, QK.ADMIN_USUARIOS, QK.ME,
  ]) {
    qc.invalidateQueries({ queryKey })
  }
}

/** Tras guardar una clave de configuración: el listado de directiva y la lectura pública de esa clave. */
export function invalidarConfig(qc: QueryClient, clave: string) {
  qc.invalidateQueries({ queryKey: QK.CONFIGURACION })
  qc.invalidateQueries({ queryKey: QK.CONFIG(clave) })
}
