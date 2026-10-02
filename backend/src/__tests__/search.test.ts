import { describe, it, expect } from 'vitest'
import { likePattern } from '../lib/search'

describe('likePattern', () => {
  it('envuelve en % y escapa los comodines del usuario', () => {
    expect(likePattern('catan')).toBe('%catan%')
    expect(likePattern('100%_x\\')).toBe('%100\\%\\_x\\\\%')
  })
})
