import type { QueryClient } from '@tanstack/react-query'

/**
 * Query keys centralizadas. Usar siempre estas constantes en useQuery y useMutation
 * para garantizar que las invalidaciones sean consistentes entre áreas de la app.
 */
export const QK = {
  // Auth / usuario actual
  ME: ['me'] as const,

  // Juegos — TRES keys distintas porque el mismo catálogo se consulta desde áreas distintas
  JUEGOS: ['juegos'] as const,                  // gestión ludoteca
  JUEGOS_CATALOGO: ['juegos-catalogo'] as const, // área socios – PrestamosPage
  LUDOTECA: ['ludoteca'] as const,               // área socios – LudotecaPage
  LOGS_JUEGO: (id: string) => ['juego-logs', id] as const,
  LOGS_JUEGO_ALL: ['logs-juego-all'] as const,
  SOLICITUDES_JUEGO_PENDIENTES: ['solicitudes-juego-pendientes'] as const,
  MIS_SOLICITUDES_JUEGO: ['mis-solicitudes-juego'] as const,

  // Préstamos
  MIS_PRESTAMOS: ['mis-prestamos'] as const,
  PRESTAMOS_GESTION: ['prestamos-gestion'] as const,

  // Socios
  SOCIOS_GESTION: ['socios-gestion'] as const,
  SOCIOS_ACTIVOS: ['socios-activos'] as const,
  SOCIOS_ACTIVOS_LLAVES: ['socios-activos-llaves'] as const,
  SOCIOS_LLAVES: ['socios-llaves'] as const,
  PENDIENTES: ['pendientes'] as const,

  // Admin
  ADMIN_USUARIOS: ['admin-usuarios'] as const,

  // Configuración
  CONFIGURACION: ['configuracion'] as const,
  CONFIG: (clave: string) => ['config', clave] as const,
  CONFIG_CLUB_LINKS: ['config-club-links'] as const,

  // Visitas
  VISITAS: ['visitas-listado'] as const,
} as const

/**
 * Invalida TODAS las queries del catálogo de juegos.
 * Llamar tras cualquier operación que cambie el estado o disponibilidad de un juego:
 * crear, editar, retirar, reactivar, eliminar, prestar, devolver.
 */
export function invalidarJuegos(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: QK.JUEGOS })
  qc.invalidateQueries({ queryKey: QK.JUEGOS_CATALOGO })
  qc.invalidateQueries({ queryKey: QK.LUDOTECA })
}

/**
 * Invalida todas las queries de préstamos (propios y de gestión).
 * Llamar tras solicitar, renovar, devolver o aprobar un préstamo.
 */
export function invalidarPrestamos(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: QK.MIS_PRESTAMOS })
  qc.invalidateQueries({ queryKey: QK.PRESTAMOS_GESTION })
}
