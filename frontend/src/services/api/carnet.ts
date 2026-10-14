import { api } from './client'

export interface CarnetVerificado {
  nombre: string
  apellidos: string
  verificado_en: string
}

export const carnetApi = {
  // Token firmado del QR (caduca en 5 min); solo con consentimiento para tiendas
  emitir: () => api.get<{ data: { token: string; expira: string } }>('/carnet'),
  // Pública: lo que ve la tienda al escanear
  verificar: (token: string) => api.get<{ data: CarnetVerificado }>(`/carnet/${encodeURIComponent(token)}`),
}
