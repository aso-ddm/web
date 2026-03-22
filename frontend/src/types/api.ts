// ── Roles ────────────────────────────────────────────────────────────────────
export type Rol =
  | 'presidente'
  | 'secretario'
  | 'tesorero'
  | 'vocal'
  | 'ludotecario'
  | 'socio_basico'

export type EstadoSocio = 'pendiente' | 'activo' | 'inactivo' | 'baja'
export type TipoCuota = 'individual' | 'pareja' | 'familiar'

// ── Usuario ───────────────────────────────────────────────────────────────────
export interface Usuario {
  id: string
  email: string
  nombre: string
  apellidos: string
  dni: string
  telefono?: string | null
  fecha_nacimiento?: string | null
  direccion?: string | null
  alias_telegram?: string | null
  usuario_bgg?: string | null
  apodo?: string | null
  tipo_cuota: TipoCuota
  consentimiento_tiendas?: boolean
  roles: Rol[]
  estado: EstadoSocio
  fecha_alta?: string | null
  tiene_llaves: boolean
  fecha_solicitud_llaves?: string | null
  fecha_aprobacion_llaves?: string | null
}

// ── Auth payloads ────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  nombre: string
  apellidos: string
  dni: string
  telefono?: string
  fecha_nacimiento?: string
  direccion?: string
  alias_telegram?: string
  usuario_bgg?: string
  apodo?: string
  tipo_cuota: TipoCuota
  consentimiento_tiendas: boolean
}

export interface LoginResponse {
  data: {
    usuario: Usuario
    token: string
  }
}

// ── Juego ─────────────────────────────────────────────────────────────────────
export type EstadoJuego = 'disponible' | 'prestado' | 'mantenimiento'

export interface Juego {
  id: string
  titulo: string
  autor?: string | null
  editorial?: string | null
  anio_publicacion?: number | null
  num_jugadores_min?: number | null
  num_jugadores_max?: number | null
  duracion_minutos?: number | null
  edad_recomendada?: number | null
  categoria?: string | null
  estado: EstadoJuego
  propietario?: string | null
  foto_url?: string | null
  bgg_id?: string | null
}

// ── Préstamo ──────────────────────────────────────────────────────────────────
export type EstadoPrestamo = 'pendiente' | 'aprobado' | 'rechazado' | 'activo' | 'devuelto'

export interface Prestamo {
  id: string
  juego_id: string
  socio_id: string
  estado: EstadoPrestamo
  fecha_solicitud: string
  fecha_aprobacion?: string | null
  fecha_prestamo?: string | null
  fecha_devolucion?: string | null
  motivo_rechazo?: string | null
  notas?: string | null
  juego?: Pick<Juego, 'id' | 'titulo' | 'foto_url' | 'categoria'>
  socio?: Pick<Usuario, 'id' | 'nombre' | 'apellidos' | 'email'> & { apodo?: string | null }
}

// ── Visita ────────────────────────────────────────────────────────────────────
export interface Visita {
  id: string
  nombre_completo: string
  fecha_visita: string
  numero_visita: number
  es_pago: boolean
  importe?: string | null
  socio_registro_id: string
}

export interface VisitanteSugerido {
  nombre_completo: string
  total_visitas: number
  ultima_visita: string | null
}

// ── Respuesta paginada ────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ── Respuesta genérica de la API ──────────────────────────────────────────────
export interface ApiError {
  error: string
  details?: Record<string, string[]>
}
