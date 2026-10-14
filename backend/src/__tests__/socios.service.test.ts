import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Rol } from '@prisma/client'
import { SociosService, normalizarRoles, salirDeCuotaConjunta } from '../services/socios.service'
import { createPrismaMock } from './helpers/prisma.mock'
import type { PrismaClient } from '@prisma/client'

let prisma: PrismaClient
let service: SociosService

beforeEach(() => {
  prisma = createPrismaMock()
  service = new SociosService(prisma)
})

const socioActivo = {
  id: 'u1',
  nombre: 'Ana',
  estado: 'activo',
  roles: ['socio_basico'],
  tiene_llaves: false,
  fecha_alta: new Date('2020-01-01'),
}

describe('SociosService.setLlaves', () => {
  it('socio no encontrado → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.setLlaves('u1', true, 'admin1')).rejects.toThrow('Socio no encontrado')
  })

  it('asignar a socio no activo → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'baja',
    })

    await expect(service.setLlaves('u1', true, 'admin1')).rejects.toThrow(
      'Solo se pueden asignar llaves a socios activos',
    )
  })

  it('activo → asigna llaves', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(socioActivo)
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({ ...socioActivo, tiene_llaves: true })

    await service.setLlaves('u1', true, 'admin1')

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { tiene_llaves: true, historial_estado: { create: { tipo: 'llaves_entregadas', por_id: 'admin1' } } },
      }),
    )
  })

  it('socio de baja → se le pueden retirar las llaves', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'baja',
      tiene_llaves: true,
    })
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue(socioActivo)

    await expect(service.setLlaves('u1', false, 'admin1')).resolves.toBeDefined()
  })
})

describe('SociosService.aprobar', () => {
  it('no encontrado → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.aprobar('u1', 'admin', Rol.socio_basico)).rejects.toThrow('Socio no encontrado')
  })

  it('estado !== pendiente → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'activo',
    })

    await expect(service.aprobar('u1', 'admin', Rol.socio_basico)).rejects.toThrow(
      'Solo se pueden aprobar solicitudes en estado pendiente',
    )
  })

  it('pendiente → actualiza a activo con fecha_alta, aprobado_por_id y rol', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'pendiente',
    })
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'activo',
      roles: [Rol.socio_basico],
    })

    const result = await service.aprobar('u1', 'admin1', Rol.socio_basico)

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'activo',
          fecha_alta: expect.any(Date),
          aprobado_por_id: 'admin1',
          roles: [Rol.socio_basico],
          pagos_cuota: { create: expect.objectContaining({ estado: 'pagado' }) },
        }),
      }),
    )
    expect(result).toMatchObject({ estado: 'activo' })
  })
})

describe('SociosService.rechazar', () => {
  it('no encontrado → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.rechazar('u1', 'admin')).rejects.toThrow('Socio no encontrado')
  })

  it('estado !== pendiente → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'activo',
    })

    await expect(service.rechazar('u1', 'admin')).rejects.toThrow(
      'Solo se pueden rechazar solicitudes en estado pendiente',
    )
  })

  it('pendiente → actualiza a baja', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'pendiente',
    })
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'baja',
    })

    await service.rechazar('u1', 'admin1')

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'baja',
          fecha_baja: expect.any(Date),
          baja_por_id: 'admin1',
        }),
      }),
    )
  })
})

describe('SociosService.darDeBaja', () => {
  it('ya está de baja → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'baja',
    })

    await expect(service.darDeBaja('u1', 'admin')).rejects.toThrow('El socio ya está dado de baja')
  })

  it('activo → actualiza a baja', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(socioActivo)
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'baja',
    })

    await service.darDeBaja('u1', 'admin1')

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'baja',
          baja_por_id: 'admin1',
          historial_estado: { create: [{ tipo: 'baja', por_id: 'admin1' }] },
        }),
      }),
    )
  })
})

describe('SociosService.updateRoles', () => {
  it('cambiar tus propios roles → throws', async () => {
    await expect(service.updateRoles('u1', [Rol.presidente], 'u1')).rejects.toThrow(
      'No puedes cambiar tus propios roles',
    )
  })

  it('asignar administrador → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(socioActivo)

    await expect(service.updateRoles('u1', [Rol.administrador], 'admin1')).rejects.toThrow(
      'El rol de administrador no se puede asignar ni retirar',
    )
  })

  it('retirar administrador → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      roles: [Rol.administrador],
    })

    await expect(service.updateRoles('u1', [Rol.socio_basico], 'admin1')).rejects.toThrow(
      'El rol de administrador no se puede asignar ni retirar',
    )
  })

  it('cambio normal de otro socio → actualiza', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(socioActivo)
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({ ...socioActivo, roles: [Rol.tesorero] })

    await service.updateRoles('u1', [Rol.tesorero], 'admin1')

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { roles: [Rol.tesorero] } }),
    )
  })

  it('aprobar alta con rol administrador → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'pendiente',
      roles: [],
    })

    await expect(service.aprobar('u1', 'admin1', Rol.administrador)).rejects.toThrow(
      'El rol de administrador no se puede asignar ni retirar',
    )
  })
})

describe('normalizarRoles', () => {
  it('cargo + ludotecario → válido', () => {
    expect(normalizarRoles([Rol.vocal, Rol.ludotecario])).toEqual([Rol.vocal, Rol.ludotecario])
  })
  it('solo ludotecario → añade socio_basico', () => {
    expect(normalizarRoles([Rol.ludotecario])).toEqual([Rol.socio_basico, Rol.ludotecario])
  })
  it('tesorero + ludotecario → válido, rol base primero', () => {
    expect(normalizarRoles([Rol.ludotecario, Rol.tesorero])).toEqual([Rol.tesorero, Rol.ludotecario])
  })
  it('dos roles base → throws', () => {
    expect(() => normalizarRoles([Rol.vocal, Rol.tesorero])).toThrow('Solo se puede tener un rol')
  })
  it('administrador sin rol base → no añade socio_basico', () => {
    expect(normalizarRoles([Rol.administrador])).toEqual([Rol.administrador])
  })
})

describe('SociosService.darDeBaja — protecciones', () => {
  it('darse de baja a uno mismo → throws', async () => {
    await expect(service.darDeBaja('u1', 'u1')).rejects.toThrow('No puedes darte de baja a ti mismo')
  })

  it('dar de baja a un administrador → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      roles: [Rol.administrador],
    })
    await expect(service.darDeBaja('u1', 'otro')).rejects.toThrow(
      'Una cuenta de administrador no se puede dar de baja',
    )
  })
})

describe('SociosService.getPendientes', () => {
  it('grupo → miembros sin el titular (que también tiene solicitud_grupal_id)', async () => {
    ;(prisma.usuario.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(prisma.solicitudGrupal.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'g1',
        titular_id: 't1',
        miembros: [
          { id: 't1', nombre: 'Titular', relaciones_como_relacionado: [] },
          { id: 'm1', nombre: 'Pareja', relaciones_como_relacionado: [{ tipo_relacion: 'pareja', socio_principal_id: 't1' }] },
        ],
      },
    ])

    const { grupos } = await service.getPendientes()

    expect(grupos[0].miembros).toEqual([{ id: 'm1', nombre: 'Pareja', tipo_relacion: 'pareja' }])
  })
})

describe('SociosService — socios pendientes', () => {
  beforeEach(() => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ...socioActivo, estado: 'pendiente' })
  })

  it('darDeBaja → throws (rompería la aprobación del grupo)', async () => {
    await expect(service.darDeBaja('u1', 'admin')).rejects.toThrow('pendiente')
    expect(prisma.usuario.update).not.toHaveBeenCalled()
  })

  it('updateRoles → throws', async () => {
    await expect(service.updateRoles('u1', [Rol.vocal], 'admin')).rejects.toThrow('pendiente')
    expect(prisma.usuario.update).not.toHaveBeenCalled()
  })
})

describe('salirDeCuotaConjunta', () => {
  const pago = { anio: 2026, mes: 9, estado: 'pagado', revisado_por_id: 'dir' }
  const conGrupo = (titular_id: string, miembros: string[]) => ({
    nombre: 'Ana',
    apellidos: 'López',
    solicitud_grupal: { id: 'g1', titular_id, miembros: miembros.map((id) => ({ id })) },
  })
  const mock = (m: unknown) => m as ReturnType<typeof vi.fn>

  beforeEach(() => {
    mock(prisma.pagoCuota.findMany).mockResolvedValue([pago])
  })

  it('sale un miembro de un grupo de 3 → copia los pagos del titular y el grupo sigue', async () => {
    mock(prisma.usuario.findUnique).mockResolvedValue(conGrupo('t', ['t', 'm1', 'm2']))

    await salirDeCuotaConjunta(prisma as never, 'm1', 'dir', 'Sale')

    expect(prisma.pagoCuota.findMany).toHaveBeenCalledWith({ where: { socio_id: 't' } })
    expect(prisma.pagoCuota.createMany).toHaveBeenCalledWith({ data: [{ ...pago, socio_id: 'm1' }] })
    expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'm1' }, data: { solicitud_grupal_id: null, tipo_cuota: 'individual' },
    }))
    expect(prisma.solicitudGrupal.update).not.toHaveBeenCalled()
    expect(prisma.solicitudGrupal.delete).not.toHaveBeenCalled()
  })

  it('sale el titular de un grupo de 3 → la titularidad y la copia pasan al siguiente', async () => {
    mock(prisma.usuario.findUnique).mockResolvedValue(conGrupo('t', ['t', 'm1', 'm2']))

    await salirDeCuotaConjunta(prisma as never, 't', 'dir', 'Sale')

    expect(prisma.pagoCuota.createMany).toHaveBeenCalledWith({ data: [{ ...pago, socio_id: 'm1' }] })
    expect(prisma.solicitudGrupal.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { titular_id: 'm1' } })
    expect(prisma.solicitudGrupal.delete).not.toHaveBeenCalled()
  })

  it('grupo de 2 → se disuelve y los dos pasan a individual', async () => {
    mock(prisma.usuario.findUnique).mockResolvedValue(conGrupo('t', ['t', 'm1']))

    await salirDeCuotaConjunta(prisma as never, 'm1', 'dir', 'Sale')

    for (const id of ['m1', 't']) {
      expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id }, data: { solicitud_grupal_id: null, tipo_cuota: 'individual' },
      }))
    }
    expect(prisma.solicitudGrupal.delete).toHaveBeenCalledWith({ where: { id: 'g1' } })
    expect(prisma.historialEstadoSocio.create).toHaveBeenCalledTimes(2)
  })

  it('socio sin grupo → throws', async () => {
    mock(prisma.usuario.findUnique).mockResolvedValue({ nombre: 'Ana', apellidos: 'López', solicitud_grupal: null })

    await expect(salirDeCuotaConjunta(prisma as never, 'u1', 'dir', 'Sale')).rejects.toThrow('no pertenece a una cuota conjunta')
  })
})
