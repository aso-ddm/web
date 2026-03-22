import { api } from './client'
import type { Visita, VisitanteSugerido } from '@/types/api'

export const visitasApi = {
  buscar: (nombre: string) =>
    api.get<{ data: VisitanteSugerido[] }>(`/visitas/buscar?nombre=${encodeURIComponent(nombre)}`),

  registrar: (nombre_completo: string) =>
    api.post<{ data: Visita }>('/visitas', { nombre_completo }),
}
