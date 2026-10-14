// Guardián del contrato frontend ↔ backend: roles, enums y reglas del registro están escritos en los dos lados
// (sin paquete compartido). Si alguien cambia uno y no el otro, este test falla en CI antes de desplegar.
import { describe, it, expect } from 'vitest'
import { Rol, EstadoSocio, EstadoJuego } from '@prisma/client'
import { ROLES } from '../middleware/auth'
import { registerSchema } from '../schemas/auth.schema'
import { ROL_LABELS, DIRECTIVA, DIRECTIVA_Y_VOCALES, DIRECTIVA_Y_LUDOTECARIO } from '../../../frontend/src/lib/roles'
import { ESTADO_SOCIO_VARIANT } from '../../../frontend/src/lib/estados'
import { estadoConfig } from '../../../frontend/src/pages/ludoteca/juegos/constants'
import { registroSchema } from '../../../frontend/src/pages/registro/schema'

const ordenados = (xs: readonly string[]) => [...xs].sort()

describe('roles y enums: el frontend conoce los mismos valores que Prisma', () => {
  it('Rol', () => expect(ordenados(Object.keys(ROL_LABELS))).toEqual(ordenados(Object.values(Rol))))
  it('EstadoSocio', () => expect(ordenados(Object.keys(ESTADO_SOCIO_VARIANT))).toEqual(ordenados(Object.values(EstadoSocio))))
  it('EstadoJuego', () => expect(ordenados(Object.keys(estadoConfig))).toEqual(ordenados(Object.values(EstadoJuego))))
})

describe('grupos de roles: las rutas del frontend piden lo mismo que requireRoles', () => {
  it('DIRECTIVA', () => expect(ordenados(DIRECTIVA)).toEqual(ordenados(ROLES.DIRECTIVA)))
  it('DIRECTIVA_Y_VOCALES', () => expect(ordenados(DIRECTIVA_Y_VOCALES)).toEqual(ordenados(ROLES.DIRECTIVA_Y_VOCALES)))
  it('DIRECTIVA_Y_LUDOTECARIO', () => expect(ordenados(DIRECTIVA_Y_LUDOTECARIO)).toEqual(ordenados(ROLES.DIRECTIVA_Y_LUDOTECARIO)))
})

describe('registro: el formulario y la API aceptan y rechazan lo mismo', () => {
  const persona = {
    nombre: 'Ana', apellidos: 'García', dni: '12345678Z', email: 'ana@example.com', telefono: '600000000',
    fecha_nacimiento: '1990-05-01', direccion: 'Calle Mayor 1', apodo: 'Anita', consentimiento_tiendas: false,
    password: 'Password1',
  }
  const miembro = { ...persona, nombre: 'Luis', dni: '00000000T', email: 'luis@example.com', apodo: 'Luisito' }
  const individual = { tipo_cuota: 'individual', ...persona }
  const conjunta = { tipo_cuota: 'conjunta', ...persona, miembros_adicionales: [miembro] }

  const casos: [string, Record<string, unknown>][] = [
    ['individual válido', individual],
    ['conjunta válida', conjunta],
    ['apellidos de 1 carácter', { ...individual, apellidos: 'G' }],
    ['sin teléfono', { ...individual, telefono: '' }],
    ['sin dirección', { ...individual, direccion: '' }],
    ['miembro sin dirección', { ...conjunta, miembros_adicionales: [{ ...miembro, direccion: '' }] }],
    ['miembro sin teléfono', { ...conjunta, miembros_adicionales: [{ ...miembro, telefono: '' }] }],
    ['letra del DNI incorrecta', { ...individual, dni: '12345678A' }],
    ['menor de edad', { ...individual, fecha_nacimiento: `${new Date().getFullYear() - 10}-01-01` }],
    ['contraseña sin mayúscula', { ...individual, password: 'password1' }],
    ['sin apodo', { ...individual, apodo: ' ' }],
    ['sin miembros en conjunta', { ...conjunta, miembros_adicionales: [] }],
  ]

  // El formulario añade confirmPassword (solo existe en el front)
  const conConfirmacion = (d: Record<string, unknown>) => ({
    ...d,
    confirmPassword: d.password,
    ...(Array.isArray(d.miembros_adicionales) && {
      miembros_adicionales: d.miembros_adicionales.map((m: { password: string }) => ({ ...m, confirmPassword: m.password })),
    }),
  })

  it.each(casos)('%s', (_, datos) => {
    const front = registroSchema.safeParse(conConfirmacion(datos)).success
    const back = registerSchema.safeParse(datos).success
    expect({ front, back }).toEqual({ front: back, back })
  })

  it('los casos válidos se aceptan (si no, el test de arriba compararía dos rechazos)', () => {
    expect(registerSchema.safeParse(individual).success).toBe(true)
    expect(registerSchema.safeParse(conjunta).success).toBe(true)
  })
})
