/**
 * Seed de DESARROLLO: borra todos los datos (salvo Configuración) y carga un club de prueba completo.
 * Ejecutar tras `prisma db seed` (que asegura la configuración):  pnpm db:seed:dev
 *
 * Todos los usuarios de prueba tienen la contraseña Dragon1234. El admin (admin@dragondemadera.com) se conserva
 * con su contraseña; si no existe se crea con SEED_ADMIN_PASSWORD (o Dragon1234 si no está definida).
 */
import 'dotenv/config'
import { PrismaClient, Rol, EstadoSocio, TipoCuota, TipoLogJuego, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

// Borra datos reales si se lanza contra la BD equivocada: fuera de local hay que pedirlo explícitamente
const url = process.env.DATABASE_URL ?? ''
const esLocal = process.env.NODE_ENV !== 'production' && /@(localhost|127\.0\.0\.1)[:/]/.test(url)
if (!esLocal && process.env.PERMITIR_SEED_DEV !== 'si') {
  console.error('✗ seed-dev solo corre contra una BD local. En un servidor de pruebas: PERMITIR_SEED_DEV=si')
  process.exit(1)
}

const prisma = new PrismaClient()
const PASSWORD = 'Dragon1234'
const ADMIN_EMAIL = 'admin@dragondemadera.com'

const DIA = 86_400_000
const ahora = Date.now()
const haceDias = (d: number) => new Date(ahora - d * DIA)
const finDia = (d: Date) => { const r = new Date(d); r.setHours(23, 59, 59, 0); return r }
const LETRAS = 'TRWAGMYFPDXBNJZSQVHLCKE'
const dni = (n: number) => `${String(n).padStart(8, '0')}${LETRAS[n % 23]}`
let dniSeq = 12_345_000

// Comprobante de ejemplo para las solicitudes pendientes (el backend sirve <cwd>/uploads/transferencias)
const COMPROBANTE = 'comprobante-demo.pdf'
const uploadsDir = process.env.UPLOADS_DIR ?? path.resolve(__dirname, '../backend/uploads/transferencias')
fs.mkdirSync(uploadsDir, { recursive: true })
fs.writeFileSync(
  path.join(uploadsDir, COMPROBANTE),
  '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
  '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
  '4 0 obj<</Length 52>>stream\nBT /F1 14 Tf 20 50 Td (Comprobante de prueba) Tj ET\nendstream endobj\n' +
  '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
)

async function main() {
  // ── Limpieza (orden por claves foráneas) ────────────────────────────────
  await prisma.$transaction([
    prisma.logJuego.deleteMany(),
    prisma.prestamo.deleteMany(),
    prisma.solicitudJuego.deleteMany(),
    prisma.juego.deleteMany(),
    prisma.visita.deleteMany(),
    prisma.pagoCuota.deleteMany(),
    prisma.historialEstadoSocio.deleteMany(),
    prisma.relacionSocio.deleteMany(),
    prisma.usuario.updateMany({ data: { solicitud_grupal_id: null, aprobado_por_id: null, baja_por_id: null } }),
    prisma.solicitudGrupal.deleteMany(),
    prisma.usuario.deleteMany({ where: { email: { not: ADMIN_EMAIL } } }),
  ])

  const password_hash = await bcrypt.hash(PASSWORD, 10)

  type Datos = Partial<Prisma.UsuarioUncheckedCreateInput> & { email: string; nombre: string; apellidos: string }
  const crear = (d: Datos) =>
    prisma.usuario.create({
      data: {
        password_hash,
        dni: dni(dniSeq++),
        roles: [Rol.socio_basico],
        estado: EstadoSocio.activo,
        telefono: `6${String(dniSeq).slice(-8)}`,
        fecha_nacimiento: new Date(1975 + (dniSeq % 30), dniSeq % 12, 1 + (dniSeq % 27)),
        direccion: `Calle Mayor ${dniSeq % 90}, Alcalá de Henares`,
        consentimiento_tiendas: dniSeq % 2 === 0,
        ...d,
      },
    })

  // ── Junta directiva y staff ─────────────────────────────────────────────
  const admin = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } }) ?? await crear({
    email: ADMIN_EMAIL, nombre: 'Admin', apellidos: 'Dragón de Madera', dni: '00000000A', roles: [Rol.administrador], fecha_alta: new Date(),
    password_hash: process.env.SEED_ADMIN_PASSWORD ? await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12) : password_hash,
  })
  const presi = await crear({ email: 'presidente@test.com', nombre: 'Lucía', apellidos: 'Fernández Ruiz', apodo: 'Lu', alias_telegram: 'lucia_fr', roles: [Rol.presidente], fecha_alta: haceDias(1200), tiene_llaves: true, aprobado_por_id: admin.id })
  const secre = await crear({ email: 'secretario@test.com', nombre: 'Javier', apellidos: 'Moreno Díaz', alias_telegram: 'javimd', roles: [Rol.secretario], fecha_alta: haceDias(1000), tiene_llaves: true, aprobado_por_id: presi.id })
  const teso = await crear({ email: 'tesorero@test.com', nombre: 'Marta', apellidos: 'Gil Navarro', roles: [Rol.tesorero], fecha_alta: haceDias(950), tiene_llaves: true, aprobado_por_id: presi.id })
  const vocal = await crear({ email: 'vocal@test.com', nombre: 'Sergio', apellidos: 'Ortega Blanco', apodo: 'Sergi', roles: [Rol.vocal], fecha_alta: haceDias(700), aprobado_por_id: presi.id })
  const ludo = await crear({ email: 'ludotecario@test.com', nombre: 'Andrea', apellidos: 'Castro León', alias_telegram: 'andrea_meeples', roles: [Rol.ludotecario], fecha_alta: haceDias(600), tiene_llaves: true, aprobado_por_id: presi.id })
  const socio = await crear({ email: 'socio@test.com', nombre: 'Pablo', apellidos: 'Sánchez Vega', apodo: 'Pablete', alias_telegram: 'pablo_sv', roles: [Rol.socio_basico], fecha_alta: haceDias(300), aprobado_por_id: secre.id })

  // ── Socios básicos activos ──────────────────────────────────────────────
  const nombres: [string, string][] = [
    ['Carmen', 'López Martín'], ['David', 'García Romero'], ['Elena', 'Jiménez Torres'], ['Raúl', 'Muñoz Serrano'],
    ['Irene', 'Álvarez Molina'], ['Hugo', 'Romero Delgado'], ['Nuria', 'Rubio Ibáñez'], ['Óscar', 'Marín Cano'],
    ['Paula', 'Herrera Prieto'], ['Adrián', 'Peña Vidal'], ['Sara', 'Núñez Campos'], ['Iván', 'Lorenzo Méndez'],
  ]
  const basicos = []
  for (const [i, [nombre, apellidos]] of nombres.entries()) {
    basicos.push(await crear({
      email: `${nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()}@test.com`,
      nombre, apellidos,
      alias_telegram: i % 3 ? `${nombre.toLowerCase()}_${i}` : null,
      fecha_alta: haceDias(30 + i * 45),
      tiene_llaves: i === 1 || i === 5,
      aprobado_por_id: i % 2 ? presi.id : secre.id,
    }))
  }

  // ── Cuota conjunta aprobada (titular + pareja + hijo) ───────────────────
  const famTitular = await crear({ email: 'familia.titular@test.com', nombre: 'Rosa', apellidos: 'Domínguez Soler', tipo_cuota: TipoCuota.conjunta, fecha_alta: haceDias(400), aprobado_por_id: presi.id })
  const grupoOk = await prisma.solicitudGrupal.create({ data: { titular_id: famTitular.id, estado: 'aprobada' } })
  await prisma.usuario.update({ where: { id: famTitular.id }, data: { solicitud_grupal_id: grupoOk.id } })
  const famPareja = await crear({ email: 'familia.pareja@test.com', nombre: 'Tomás', apellidos: 'Reyes Pastor', tipo_cuota: TipoCuota.conjunta, solicitud_grupal_id: grupoOk.id, fecha_alta: haceDias(400), aprobado_por_id: presi.id })
  const famHijo = await crear({ email: 'familia.hijo@test.com', nombre: 'Mario', apellidos: 'Reyes Domínguez', tipo_cuota: TipoCuota.conjunta, solicitud_grupal_id: grupoOk.id, fecha_alta: haceDias(400), fecha_nacimiento: new Date(2006, 4, 12), aprobado_por_id: presi.id })
  await prisma.relacionSocio.createMany({ data: [
    { socio_principal_id: famTitular.id, socio_relacionado_id: famPareja.id, tipo_relacion: 'pareja', fecha_inicio: haceDias(400) },
    { socio_principal_id: famTitular.id, socio_relacionado_id: famHijo.id, tipo_relacion: 'familiar_directo', fecha_inicio: haceDias(400) },
  ] })

  // ── Solicitudes pendientes (individuales + una conjunta) ────────────────
  await crear({ email: 'pendiente1@test.com', nombre: 'Alba', apellidos: 'Santos Ferrer', estado: EstadoSocio.pendiente, comprobante_transferencia: COMPROBANTE, alias_telegram: 'alba_sf' })
  await crear({ email: 'pendiente2@test.com', nombre: 'Gonzalo', apellidos: 'Vicente Arias', dni: 'X1234567L', estado: EstadoSocio.pendiente, comprobante_transferencia: COMPROBANTE })
  const pendTitular = await crear({ email: 'pendiente.titular@test.com', nombre: 'Beatriz', apellidos: 'Crespo Lara', tipo_cuota: TipoCuota.conjunta, estado: EstadoSocio.pendiente, comprobante_transferencia: COMPROBANTE })
  const grupoPend = await prisma.solicitudGrupal.create({ data: { titular_id: pendTitular.id } })
  await prisma.usuario.update({ where: { id: pendTitular.id }, data: { solicitud_grupal_id: grupoPend.id } })
  const pendPareja = await crear({ email: 'pendiente.pareja@test.com', nombre: 'Rubén', apellidos: 'Ortiz Gallego', tipo_cuota: TipoCuota.conjunta, estado: EstadoSocio.pendiente, solicitud_grupal_id: grupoPend.id })
  await prisma.relacionSocio.create({ data: { socio_principal_id: pendTitular.id, socio_relacionado_id: pendPareja.id, tipo_relacion: 'pareja' } })

  // ── Bajas ───────────────────────────────────────────────────────────────
  const bajas = [
    await crear({ email: 'baja1@test.com', nombre: 'Fernando', apellidos: 'Calvo Bravo', estado: EstadoSocio.baja, fecha_alta: haceDias(800), fecha_baja: haceDias(120), aprobado_por_id: presi.id, baja_por_id: secre.id }),
    await crear({ email: 'baja2@test.com', nombre: 'Laura', apellidos: 'Pascual Rey', estado: EstadoSocio.baja, fecha_alta: haceDias(500), fecha_baja: haceDias(20), aprobado_por_id: secre.id, baja_por_id: presi.id }),
  ]

  // ── Historial de altas y bajas ──────────────────────────────────────────
  const activos = [presi, secre, teso, vocal, ludo, socio, ...basicos, famTitular, famPareja, famHijo]
  await prisma.historialEstadoSocio.createMany({ data: [
    ...[...activos, ...bajas].map((u) => ({ socio_id: u.id, tipo: 'alta' as const, por_id: u.aprobado_por_id, created_at: u.fecha_alta! })),
    ...bajas.map((u) => ({ socio_id: u.id, tipo: 'baja' as const, por_id: u.baja_por_id, created_at: u.fecha_baja! })),
  ] })

  // ── Cuotas: últimos 6 meses (conjunta solo en el titular) ───────────────
  const pagos: Prisma.PagoCuotaCreateManyInput[] = []
  const hoy = new Date()
  for (const [i, u] of activos.entries()) {
    if (u.solicitud_grupal_id && u.id !== famTitular.id) continue
    for (let m = 0; m < 6; m++) {
      const f = new Date(hoy.getFullYear(), hoy.getMonth() - m, 1)
      if (f < new Date(u.fecha_alta!.getFullYear(), u.fecha_alta!.getMonth(), 1)) break
      if (m === 0 && i % 3 === 0) continue // mes en curso sin revisar
      const impago = (m === 0 && i % 4 === 1) || (m === 1 && i % 5 === 2)
      pagos.push({ socio_id: u.id, anio: f.getFullYear(), mes: f.getMonth() + 1, estado: impago ? 'sin_pagar' : 'pagado', revisado_por_id: teso.id })
    }
  }
  await prisma.pagoCuota.createMany({ data: pagos })

  // ── Ludoteca ────────────────────────────────────────────────────────────
  const catalogo: [string, number, number, string?][] = [
    ['Catan', 3, 4], ['Carcassonne', 2, 5], ['Ticket to Ride: Europa', 2, 5], ['Azul', 2, 4], ['7 Wonders', 3, 7],
    ['Dixit', 3, 8], ['Pandemic', 2, 4], ['Terraforming Mars', 1, 5], ['Wingspan', 1, 5], ['Splendor', 2, 4],
    ['Codenames', 2, 8], ['Agricola', 1, 4], ['Puerto Rico', 3, 5], ['Brass: Birmingham', 2, 4], ['Gloomhaven', 1, 4],
    ['Twilight Imperium IV', 3, 6], ['El Grande', 2, 5], ['Root', 2, 4], ['Everdell', 1, 4], ['Scythe', 1, 5],
    ['Patchwork', 2, 2], ['Jaipur', 2, 2], ['Hanabi', 2, 5], ['The Crew', 2, 5], ['Cascadia', 1, 4],
    ['Viticulture', 1, 6], ['Concordia', 2, 5], ['Great Western Trail', 1, 4], ['Ark Nova', 1, 4], ['Spirit Island', 1, 4],
    ['Dominion', 2, 4], ['King of Tokyo', 2, 6], ['Sushi Go!', 2, 5], ['Love Letter', 2, 4], ['Coup', 2, 6],
    ['Heat: Pedal to the Metal', 1, 6, 'Incluye expansión Heavy Rain'], ['Dune: Imperium', 1, 4], ['Mysterium', 2, 7],
    ['Twilight Struggle', 2, 2, 'Falta una ficha de influencia URSS'], ['Pictomania', 3, 6],
  ]
  const propietarios = [ludo, basicos[2], basicos[7], famTitular]
  const juegos = []
  for (const [i, [nombre, min, max, notas]] of catalogo.entries()) {
    const propietario = i % 7 === 3 ? propietarios[(i / 7) | 0] : null // algunos son cesiones de socios
    const retirado = i === 38 || i === 39
    const juego = await prisma.juego.create({ data: {
      nombre, num_jugadores_min: min, num_jugadores_max: max, notas,
      localizacion: `Estantería ${'ABCD'[i % 4]}${1 + (i % 5)}`,
      propietario_id: propietario?.id,
      estado: retirado ? 'retirado' : 'en_estanteria',
      created_at: haceDias(1000 - i * 20),
    } })
    juegos.push(juego)
    await prisma.logJuego.create({ data: { juego_id: juego.id, tipo: TipoLogJuego.donado, texto: `${nombre} donado al Dragón`, usuario_id: propietario?.id ?? ludo.id, created_at: juego.created_at } })
    if (retirado) await prisma.logJuego.create({ data: { juego_id: juego.id, tipo: TipoLogJuego.retirado, texto: `${nombre} retirado: piezas perdidas`, usuario_id: ludo.id, created_at: haceDias(60) } })
  }
  await prisma.logJuego.create({ data: { juego_id: juegos[14].id, tipo: TipoLogJuego.nota_manual, texto: 'Revisado inventario: faltan 2 cartas de batalla del Bruto', usuario_id: ludo.id, created_at: haceDias(10) } })

  // ── Préstamos ───────────────────────────────────────────────────────────
  // [juego, socio, días desde el préstamo, renovaciones, devuelto hace N días (null = activo)]
  const prestamos: [number, { id: string }, number, number, number | null][] = [
    // Activos: en plazo, a punto de vencer, vencidos y renovados
    [0, socio, 3, 0, null], [7, socio, 20, 1, null], [14, basicos[0], 12, 0, null], [17, basicos[1], 25, 0, null],
    [19, basicos[3], 40, 2, null], [24, famPareja, 1, 0, null], [28, vocal, 13, 0, null], [33, basicos[6], 30, 0, null],
    // Históricos
    [0, basicos[0], 120, 0, 105], [1, socio, 90, 1, 64], [3, basicos[4], 200, 0, 190], [4, presi, 60, 0, 50],
    [5, basicos[8], 45, 0, 33], [8, socio, 150, 2, 100], [11, famHijo, 80, 0, 70], [12, basicos[9], 300, 0, 287],
    [15, basicos[10], 35, 1, 9], [20, basicos[2], 25, 0, 15], [22, bajas[1], 160, 0, 150], [29, basicos[5], 70, 0, 60],
  ]
  for (const [j, s, hace, renov, devuelto] of prestamos) {
    const juego = juegos[j]
    const fecha_prestamo = haceDias(hace)
    const fecha_limite = finDia(new Date(+fecha_prestamo + (14 + renov * 14) * DIA))
    const fecha_devolucion = devuelto === null ? null : haceDias(devuelto)
    await prisma.prestamo.create({ data: {
      juego_id: juego.id, socio_id: s.id, fecha_prestamo, fecha_limite, fecha_devolucion, renovaciones: renov,
      estado: fecha_devolucion ? 'devuelto' : 'activo',
      usuario_confirmo_dev_id: fecha_devolucion ? ludo.id : null,
      created_at: fecha_prestamo,
    } })
    await prisma.logJuego.create({ data: { juego_id: juego.id, tipo: TipoLogJuego.prestamo_activo, texto: `${juego.nombre} prestado`, usuario_id: s.id, created_at: fecha_prestamo } })
    if (fecha_devolucion) {
      await prisma.logJuego.create({ data: { juego_id: juego.id, tipo: TipoLogJuego.prestamo_devuelto, texto: `${juego.nombre} devuelto`, usuario_id: ludo.id, created_at: fecha_devolucion } })
    } else {
      await prisma.juego.update({ where: { id: juego.id }, data: { estado: 'prestado' } })
    }
  }

  // ── Solicitudes de cesión de juegos ─────────────────────────────────────
  await prisma.solicitudJuego.createMany({ data: [
    { socio_id: socio.id, nombre: 'Lost Ruins of Arnak', notas: 'Completo, con fundas', created_at: haceDias(2) },
    { socio_id: basicos[4].id, nombre: 'Clank!', created_at: haceDias(5) },
    { socio_id: famTitular.id, nombre: 'Kingdomino', notas: 'Ideal para jugar con peques', created_at: haceDias(1) },
    { socio_id: basicos[11].id, nombre: 'Monopoly', estado: 'rechazada', motivo_rechazo: 'Ya tenemos dos copias en la ludoteca', created_at: haceDias(40) },
  ] })
  for (const [s, j] of [[basicos[2], 8], [ludo, 3]] as const) {
    await prisma.solicitudJuego.create({ data: { socio_id: s.id, nombre: juegos[j].nombre, estado: 'aprobada', juego_id: juegos[j].id, created_at: juegos[j].created_at } })
  }

  // ── Visitas (gratuitas y de pago tras superar el límite) ────────────────
  const [gratis, precio] = await Promise.all(
    ['visitas_gratuitas', 'precio_visita_pago'].map(async (clave) =>
      Number((await prisma.configuracion.findUnique({ where: { clave } }))?.valor ?? (clave === 'visitas_gratuitas' ? 3 : 4))),
  )
  const visitantes: [string, number][] = [['Miguel Ángel Prieto', 5], ['Cristina Bermejo', 3], ['Álex Fuentes', 1], ['Noelia Carrasco', 2], ['Jorge Esteban', 4]]
  const registradores = [socio, presi, basicos[0], ludo, basicos[5]]
  for (const [i, [nombre_completo, veces]] of visitantes.entries()) {
    for (let n = 1; n <= veces; n++) {
      const es_pago = n > gratis
      await prisma.visita.create({ data: {
        nombre_completo, numero_visita: n, es_pago, importe: es_pago ? precio : null,
        fecha_visita: haceDias((veces - n) * 14 + i), socio_registro_id: registradores[(i + n) % registradores.length].id,
      } })
    }
  }

  // ── Configuración de ejemplo ────────────────────────────────────────────
  await prisma.configuracion.updateMany({ where: { clave: 'enlaces_interes' }, data: { valor: JSON.stringify([
    { label: 'Calendario de partidas', url: 'https://example.com/calendario' },
    { label: 'Normas de la ludoteca', url: 'https://example.com/normas' },
  ]) } })
  await prisma.configuracion.updateMany({ where: { clave: 'url_estatutos', valor: '' }, data: { valor: 'https://example.com/estatutos.pdf' } })
  await prisma.configuracion.updateMany({ where: { clave: 'url_reglamento_interno', valor: '' }, data: { valor: 'https://example.com/reglamento.pdf' } })

  console.log(`✓ Datos de prueba cargados. Contraseña de los usuarios de prueba: ${PASSWORD} (el admin conserva la suya)`)
  console.table([
    ['presidente@test.com', 'presidente'], ['secretario@test.com', 'secretario'],
    ['tesorero@test.com', 'tesorero'], ['vocal@test.com', 'vocal'], ['ludotecario@test.com', 'ludotecario'],
    ['socio@test.com', 'socio (con préstamos)'], ['familia.titular@test.com', 'titular cuota conjunta'],
    ['pendiente1@test.com', 'pendiente (no puede entrar)'], ['baja1@test.com', 'baja'],
  ].map(([email, perfil]) => ({ email, perfil })))
}

main()
  .catch((e) => {
    console.error('Error en seed-dev:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
