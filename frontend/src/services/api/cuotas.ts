import { api } from './client'
import type { EstadoPago, PagoMes } from '@/lib/cuotas'

export interface SocioCuotas {
  id: string
  nombre: string
  apellidos: string
  apodo?: string | null
  fecha_alta: string
  conjunta: boolean
  // Cuota a la que pertenecen los pagos: el grupo si es conjunta, el propio socio si es individual
  cuota_id: string
  pagos_cuota: PagoMes[]
}

export const cuotasApi = {
  getAll: () => api.get<{ data: SocioCuotas[] }>('/cuotas'),
  // estado null = volver a "sin revisar"
  marcar: (socioId: string, anio: number, mes: number, estado: EstadoPago | null) =>
    api.put<unknown>(`/cuotas/${socioId}/${anio}/${mes}`, { estado }),
}
