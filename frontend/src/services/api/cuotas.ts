import { api } from './client'
import type { EstadoPago, PagoMes } from '@/lib/cuotas'

export interface SocioCuotas {
  id: string
  nombre: string
  apellidos: string
  apodo?: string | null
  fecha_alta: string
  conjunta: boolean
  // Socio en el que se guardan los pagos (el titular si es cuota conjunta)
  cuota_id: string
  pagos_cuota: PagoMes[]
}

export const cuotasApi = {
  getAll: () => api.get<{ data: SocioCuotas[] }>('/cuotas'),
  // estado null = volver a "sin revisar"
  marcar: (socioId: string, anio: number, mes: number, estado: EstadoPago | null) =>
    api.put<unknown>(`/cuotas/${socioId}/${anio}/${mes}`, { estado }),
}
