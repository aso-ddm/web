import { api } from './client'

export interface ConfigItem {
  id: string
  clave: string
  valor: string
  tipo: string
  descripcion?: string | null
}

export const configuracionApi = {
  getAll: () => api.get<{ data: ConfigItem[] }>('/config'),
  update: (clave: string, valor: string) =>
    api.put<{ data: ConfigItem }>(`/config/${clave}`, { valor }),
}
