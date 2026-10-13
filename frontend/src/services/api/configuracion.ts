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

export interface EnlaceInteres {
  label: string
  url: string
}

export const enlacesInteresApi = {
  getAll: () =>
    configuracionApi.getOne('enlaces_interes').then((r) => JSON.parse(r.data.valor || '[]') as EnlaceInteres[]),
  save: (enlaces: EnlaceInteres[]) => configuracionApi.update('enlaces_interes', JSON.stringify(enlaces)),
}
