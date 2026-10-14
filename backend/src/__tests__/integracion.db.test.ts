// Tests contra Postgres real: concurrencia y SQL a mano que los mocks no pueden comprobar.
// Solo se ejecutan con DATABASE_URL_TEST apuntando a una base de pruebas YA migrada (nunca la de desarrollo):
//   DATABASE_URL=<url de pruebas> pnpm prisma migrate deploy        (desde la raíz)
//   DATABASE_URL_TEST=<url de pruebas> pnpm -C backend test:db
// Cada ejecución crea sus propios datos (sufijo único) y los borra al terminar.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient, EstadoSocio, Rol } from '@prisma/client'
import { PrestamosService } from '../services/prestamos.service'
import { LogsJuegoService } from '../services/logs_juego.service'
import { VisitasService } from '../services/visitas.service'
import { salirDeCuotaConjunta } from '../services/cuotaConjunta'

const url = process.env.DATABASE_URL_TEST

describe.skipIf(!url)('integración con Postgres', () => {
  let prisma: PrismaClient
  let prestamos: PrestamosService
  let visitas: VisitasService
  const run = Date.now().toString(36)
  const usuarios: string[] = []
  const juegos: string[] = []
  const grupos: string[] = []
  let n = 0

  const crearSocio = async (extra: Record<string, unknown> = {}) => {
    n++
    const u = await prisma.usuario.create({
      data: {
        email: `int-${run}-${n}@test.local`, password_hash: 'x', nombre: `Int${n}`, apellidos: 'Test',
        dni: `T${run}${n}`, roles: [Rol.socio_basico], estado: EstadoSocio.activo, fecha_alta: new Date(), ...extra,
      },
    })
    usuarios.push(u.id)
    return u
  }
  const crearJuego = async () => {
    const j = await prisma.juego.create({ data: { nombre: `Juego int ${run} ${juegos.length}` } })
    juegos.push(j.id)
    return j
  }

  beforeAll(async () => {
    // El cuerpo del describe se recorre aunque esté saltado: la conexión solo aquí
    prisma = new PrismaClient({ datasources: { db: { url } } })
    prestamos = new PrestamosService(prisma, new LogsJuegoService(prisma))
    visitas = new VisitasService(prisma)
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.prestamo.deleteMany({ where: { juego_id: { in: juegos } } })
    await prisma.juego.deleteMany({ where: { id: { in: juegos } } })
    await prisma.visita.deleteMany({ where: { socio_registro_id: { in: usuarios } } })
    await prisma.usuario.updateMany({ where: { id: { in: usuarios } }, data: { solicitud_grupal_id: null } })
    await prisma.solicitudGrupal.deleteMany({ where: { id: { in: grupos } } })
    await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } })
    await prisma.$disconnect()
  })

  it('dos socios piden el mismo juego a la vez: solo uno se lo lleva', async () => {
    const [a, b] = await Promise.all([crearSocio(), crearSocio()])
    const juego = await crearJuego()

    const r = await Promise.allSettled([
      prestamos.solicitar(a.id, { juego_id: juego.id }),
      prestamos.solicitar(b.id, { juego_id: juego.id }),
    ])

    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1)
    expect(await prisma.prestamo.count({ where: { juego_id: juego.id, estado: 'activo' } })).toBe(1)
    expect((await prisma.juego.findUniqueOrThrow({ where: { id: juego.id } })).estado).toBe('prestado')
  })

  it('un socio en el límite no lo supera con peticiones simultáneas', async () => {
    const socio = await crearSocio()
    const max = Number((await prisma.configuracion.findUnique({ where: { clave: 'max_prestamos_activos' } }))?.valor ?? 3)
    const libres = await Promise.all(Array.from({ length: max + 2 }, crearJuego))

    await Promise.allSettled(libres.map((j) => prestamos.solicitar(socio.id, { juego_id: j.id })))

    expect(await prisma.prestamo.count({ where: { socio_id: socio.id, estado: 'activo' } })).toBe(max)
  })

  it('visitas: la búsqueda agrupa mayúsculas y espacios, y dos registros a la vez llevan números distintos', async () => {
    const socio = await crearSocio()
    const nombre = `Visitante ${run}`
    await Promise.all([
      visitas.registrar({ nombre_completo: nombre, socio_registro_id: socio.id }),
      visitas.registrar({ nombre_completo: `  ${nombre.toUpperCase()}  `, socio_registro_id: socio.id }),
    ])

    const numeros = (await prisma.visita.findMany({ where: { socio_registro_id: socio.id } })).map((v) => v.numero_visita).sort()
    expect(numeros).toEqual([1, 2])

    const { data } = await visitas.buscar(`visitante ${run}`)
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({ total_visitas: 2 })
  })

  it('dos miembros salen a la vez de una cuota conjunta de tres: el grupo se disuelve, no queda de uno', async () => {
    const grupo = await prisma.solicitudGrupal.create({ data: { estado: 'aprobada' } })
    grupos.push(grupo.id)
    const [a, b, c] = await Promise.all([1, 2, 3].map(() => crearSocio({ solicitud_grupal_id: grupo.id, tipo_cuota: 'conjunta' })))

    await Promise.all([a, b].map((s) => prisma.$transaction((tx) => salirDeCuotaConjunta(tx, s.id, s.id, 'Sale'))))

    const miembros = await prisma.usuario.findMany({ where: { id: { in: [a.id, b.id, c.id] } } })
    expect(miembros.every((m) => m.solicitud_grupal_id === null && m.tipo_cuota === 'individual')).toBe(true)
    expect(await prisma.solicitudGrupal.findUnique({ where: { id: grupo.id } })).toBeNull()
  })
})
