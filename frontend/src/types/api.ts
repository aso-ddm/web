// ── Roles ────────────────────────────────────────────────────────────────────
export type Rol =
  | 'presidente'
  | 'secretario'
  | 'tesorero'
  | 'vocal'
  | 'ludotecario'
  | 'socio_basico'

export type EstadoSocio = 'pendiente' | 'activo' | 'inactivo' | 'baja'
export type TipoCuota = 'individual' | 'conjunta'
export type TipoRelacion = 'pareja' | 'familiar_directo'
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada'

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

export interface MiembroAdicionalPayload {
  nombre: string
  apellidos: string
  dni: string
  email: string
  telefono: string
  fecha_nacimiento: string
  alias_telegram: string
  apodo?: string
  consentimiento_tiendas: boolean
  password: string
  tipo_relacion: TipoRelacion
}

export type RegisterPayload =
  | {
      tipo_cuota: 'individual'
      email: string
      password: string
      nombre: string
      apellidos: string
      dni: string
      telefono?: string
      fecha_nacimiento?: string
      direccion?: string
      alias_telegram?: string
      apodo?: string
      consentimiento_tiendas: boolean
    }
  | {
      tipo_cuota: 'conjunta'
      email: string
      password: string
      nombre: string
      apellidos: string
      dni: string
      telefono?: string
      fecha_nacimiento?: string
      direccion?: string
      alias_telegram?: string
      apodo?: string
      consentimiento_tiendas: boolean
      miembros_adicionales: MiembroAdicionalPayload[]
    }

export interface SolicitudGrupal {
  id: string
  estado: EstadoSolicitud
  created_at: string
  titular: Pick<Usuario, 'id' | 'nombre' | 'apellidos' | 'dni' | 'email'> & {
    apodo?: string | null
    alias_telegram?: string | null
    tipo_cuota: TipoCuota
    created_at: string
    comprobante_transferencia?: string | null
  }
  miembros: Array<
    Pick<Usuario, 'id' | 'nombre' | 'apellidos' | 'dni' | 'email'> & {
      tipo_relacion: TipoRelacion | null
    }
  >
}

export interface LoginResponse {
  data: {
    usuario: Usuario
    token: string
  }
}

// ── Juego ─────────────────────────────────────────────────────────────────────
export type EstadoJuego = 'en_estanteria' | 'prestado' | 'retirado'

export interface Juego {
  id: string
  nombre: string
  localizacion?: string | null
  num_jugadores_min?: number | null
  num_jugadores_max?: number | null
  notas?: string | null
  estado: EstadoJuego
  propietario_id?: string | null
  propietario?: Pick<Usuario, 'id' | 'nombre' | 'apellidos'> | null
}

// ── Préstamo ──────────────────────────────────────────────────────────────────
export type EstadoPrestamo = 'activo' | 'devuelto'

export interface Prestamo {
  id: string
  juego_id: string
  socio_id: string
  estado: EstadoPrestamo
  fecha_prestamo: string
  fecha_limite: string
  fecha_devolucion?: string | null
  renovaciones: number
  notas?: string | null
  juego?: Pick<Juego, 'id' | 'nombre'>
  socio?: Pick<Usuario, 'id' | 'nombre' | 'apellidos' | 'email'> & { apodo?: string | null }
}

// ── LogJuego ──────────────────────────────────────────────────────────────────
export type TipoLogJuego = 'donado' | 'retirado' | 'prestamo_activo' | 'prestamo_devuelto' | 'nota_manual'

export interface LogJuego {
  id: string
  juego_id: string
  tipo: TipoLogJuego
  texto: string
  usuario_id?: string | null
  usuario?: Pick<Usuario, 'id' | 'nombre' | 'apellidos'> | null
  created_at: string
}

// ── SolicitudJuego ────────────────────────────────────────────────────────────
export type EstadoSolicitudJuego = 'pendiente' | 'aprobada' | 'rechazada'

export interface SolicitudJuego {
  id: string
  socio_id: string
  nombre: string
  notas?: string | null
  estado: EstadoSolicitudJuego
  motivo_rechazo?: string | null
  juego_id?: string | null
  created_at: string
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
