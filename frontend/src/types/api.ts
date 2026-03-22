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

// ── Respuesta genérica de la API ──────────────────────────────────────────────
export interface ApiError {
  error: string
  details?: Record<string, string[]>
}
