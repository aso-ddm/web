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
  getOne: (clave: string) => api.get<{ data: ConfigItem }>(`/config/${clave}`),
  update: (clave: string, valor: string) =>
    api.put<{ data: ConfigItem }>(`/config/${clave}`, { valor }),
}
