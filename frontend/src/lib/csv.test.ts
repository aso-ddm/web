import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('escapa separadores, comillas y saltos, y deja vacíos los nulos', () => {
    const csv = toCsv([{ a: 'Pérez; "el Gran"', b: null }, { a: 'x\ny', b: 3 }], [
      { titulo: 'A', valor: (f) => f.a },
      { titulo: 'B', valor: (f) => f.b },
    ])
    expect(csv).toBe('﻿A;B\r\n"Pérez; ""el Gran""";\r\n"x\ny";3')
  })
})
