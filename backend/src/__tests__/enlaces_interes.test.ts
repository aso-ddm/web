import { describe, it, expect } from 'vitest'
import { enlacesInteresSchema } from '../services/configuracion.service'

describe('enlacesInteresSchema', () => {
  it('acepta enlaces http(s) y recorta espacios', () => {
    expect(enlacesInteresSchema.parse([{ label: ' Partidas ', url: 'https://t.me/+abc' }])).toEqual([
      { label: 'Partidas', url: 'https://t.me/+abc' },
    ])
  })

  it('rechaza esquemas peligrosos y labels vacíos', () => {
    expect(() => enlacesInteresSchema.parse([{ label: 'x', url: 'javascript:alert(1)' }])).toThrow()
    expect(() => enlacesInteresSchema.parse([{ label: ' ', url: 'https://t.me/x' }])).toThrow()
  })
})
