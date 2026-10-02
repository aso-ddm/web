import { it, expect } from 'vitest'
import { z } from 'zod'
import '../lib/zodEs'

const msg = (schema: z.ZodTypeAny, value: unknown) => schema.safeParse(value).error?.issues[0].message

it('mensajes por defecto en español; los propios se respetan', () => {
  expect(msg(z.number().int(), 1.5)).toBe('Debe ser un número entero')
  expect(msg(z.number().positive(), 0)).toBe('Debe ser mayor que 0')
  expect(msg(z.string().max(500), 'x'.repeat(501))).toBe('Máximo 500 caracteres')
  expect(msg(z.object({ a: z.string() }), {})).toBe('Campo obligatorio')
  expect(msg(z.enum(['a', 'b']), 'c')).toBe('Valor no válido')
  expect(msg(z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'), 'x')).toBe('La contraseña debe tener al menos 8 caracteres')
})
