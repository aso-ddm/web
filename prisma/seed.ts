/**
 * Seed: configuración inicial, usuario administrador y un club de prueba completo.
 * Ejecutar: pnpm prisma:seed (o pnpm db:setup). BORRA todos los datos salvo Configuración y el admin.
 *
 * - Configuración: solo se crea la que falta, salvo texto_bienvenida_alta, que se pisa siempre.
 * - Admin (admin@dragondemadera.com): si existe no se modifica; si no, solo se crea si SEED_ADMIN_PASSWORD está definida.
 * - Usuarios de prueba: contraseña Dragon1234. El secretario usa la suya del servidor de pruebas.
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
  console.error('✗ el seed borra los datos: solo corre contra una BD local. En un servidor de pruebas: PERMITIR_SEED_DEV=si')
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
  // ── Configuración inicial ──────────────────────────────────────────────
  const configsIniciales = [
    {
      clave: 'dias_prestamo',
      valor: '14',
      tipo: 'numero',
      descripcion: 'Duración en días de un préstamo desde que se activa',
    },
    {
      clave: 'dias_renovacion',
      valor: '14',
      tipo: 'numero',
      descripcion: 'Días adicionales que añade cada renovación al préstamo',
    },
    {
      clave: 'max_renovaciones',
      valor: '2',
      tipo: 'numero',
      descripcion: 'Número máximo de renovaciones permitidas por préstamo',
    },
    {
      clave: 'dias_aviso_devolucion',
      valor: '3',
      tipo: 'numero',
      descripcion: 'Días antes del vencimiento para enviar aviso al socio (pendiente de implementar notificaciones)',
    },
    {
      clave: 'max_prestamos_activos',
      valor: '3',
      tipo: 'numero',
      descripcion: 'Número máximo de préstamos activos simultáneos por socio',
    },
    {
      clave: 'precio_cuota_individual',
      valor: '15',
      tipo: 'numero',
      descripcion: 'Precio mensual de la cuota individual (en euros)',
    },
    {
      clave: 'precio_cuota_adicional',
      valor: '5',
      tipo: 'numero',
      descripcion: 'Precio mensual por cada miembro adicional en una cuota conjunta (en euros)',
    },
    {
      clave: 'visitas_gratuitas',
      valor: '3',
      tipo: 'numero',
      descripcion: 'Número de visitas gratuitas permitidas para no socios antes de tener que pagar',
    },
    {
      clave: 'precio_visita_pago',
      valor: '4',
      tipo: 'numero',
      descripcion: 'Importe en euros que se cobra a los no socios que ya superaron las visitas gratuitas',
    },
    {
      clave: 'texto_bienvenida_alta',
      tipo: 'texto_largo',
      descripcion: 'Texto informativo mostrado al inicio del formulario de alta de nuevos socios',
      valor: [
        '<p><strong>Dragón de Madera</strong> - Alta de nuevo socio ¡Bienvenid@! Este formulario es para que conozcas algunas cosas importantes de la asociación y para tener tus datos que serán tratados con la privacidad y el respeto pertinente. </p>',
        '<p><strong>IDENTIDAD </strong>¡Bienvenid@ al Dragón! Somos una asociación cultural sin ánimo de lucro que fomenta el ocio a través de los juegos de mesa. Recuerda que debes realizar una transferencia periódica (entre el día 1 y el 15) a la cuenta con IBAN ES47 3023 0180 5964 0635 4008 de la cuota mensual. Para formalizar el alta haz una transferencia de la parte proporcional de días que quedan del mes de tu tipo de cuota más la cantidad íntegra de tu cuota en concepto de matrícula. </p>',
        '<p><br><strong>FORMAR PARTE</strong> Para estar al tanto de lo que sucede en la asociación hemos creado varios canales y un chat de Telegram. Instala la aplicación y serás agregado cuando procesemos el alta.</p>',
        '<p> <strong>PONER DE TU PARTE</strong> </p>',
        '<p>Llaves -&gt; Cualquier socio que sea miembro del club durante 6 meses ininterrumpidos y que cumpla la normativa vigente puede solicitar a la junta directiva la cesión de las llaves del local, mientras tanto puedes organizarte con otros socios para abrir el local cuando lo necesites o pedirlas prestadas puntualmente. </p>',
        '<p>Invitados -&gt; Es importante estar atento y anotar a los invitados que acudan al club para así contabilizar las visitas, o bien la aportación que realicen en la entrada de día. Además, somos los responsables de velar por el bienestar del local ante cualquier invitados. Esto es: Atender el bar cuando algún invitado quiera consumir, vigilar el comportamiento de estos con el material e instalaciones, y explicarle cómo funciona el club o cualquier otra cosa que necesiten.</p>',
        '<p><strong>ESTATUTOS Y REGLAMENTO INTERNO</strong> En este formulario se ha presentado un resumen de la información relevante sobre el club. Puedes consultar los documentos oficiales con los botones que aparecen a continuación. </p>',
        '<p><strong>¿DESEAS SABER MÁS?</strong> Para cualquier duda o comentario nos encontrarás en info@dragondemadera.com o escribiéndonos por Telegram a @dragondemadera_info</p>',
      ].join(''),
    },
    {
      clave: 'url_estatutos',
      valor: '',
      tipo: 'url',
      descripcion: 'URL del documento de estatutos (Google Drive, Dropbox, cualquier alojamiento)',
    },
    {
      clave: 'url_reglamento_interno',
      valor: '',
      tipo: 'url',
      descripcion: 'URL del documento de reglamento interno (Google Drive, Dropbox, cualquier alojamiento)',
    },
    {
      clave: 'telegram_bot_username',
      valor: '',
      tipo: 'texto',
      descripcion: 'Nombre de usuario del bot de Telegram (sin @), necesario para el widget de vinculación',
    },
    {
      clave: 'enlaces_interes',
      valor: '[]',
      tipo: 'json',
      descripcion: 'Enlaces de interés mostrados a los socios en Mi panel',
    },
    {
      clave: 'texto_consentimiento_tiendas',
      tipo: 'texto_largo',
      descripcion: 'Texto del checkbox de consentimiento de datos con tiendas colaboradoras (visible en el formulario de alta)',
      valor: 'Acepto que se compartan mis datos (nombre y apellidos) con las tiendas colaboradoras de la asociación (FreakMondo, Bazar de Iglesias, Dune) para poder beneficiarme del descuento del 10% en compras como socio de Dragón de Madera.',
    },
    {
      clave: 'texto_baja_socio',
      tipo: 'texto_largo',
      descripcion: 'Aviso que ve el socio en Mi panel antes de pedir la baja (qué implica darse de baja)',
      valor: [
        '<p>Vamos a avisar al secretario del club de que quieres darte de baja. Se pondrá en contacto contigo por Telegram para cerrarla.</p>',
        '<p><strong>Darte de baja implica:</strong></p><ul>',
        '<li><p>Dejarás de pagar la cuota a partir del mes siguiente. Las cuotas ya pagadas no se devuelven.</p></li>',
        '<li><p>Tendrás que devolver los juegos que tengas en préstamo y, si las tienes, las llaves del local.</p></li>',
        '<li><p>Perderás el acceso al área de socios y a los grupos del club.</p></li>',
        '<li><p>Si vuelves más adelante, tendrás que hacer una nueva alta y la antigüedad para pedir llaves empezará de cero.</p></li>',
        '</ul>',
      ].join(''),
    },
    {
      clave: 'texto_baja_confirmada',
      tipo: 'texto_largo',
      descripcion: 'Mensaje de Telegram que recibe el socio al darle de baja ({nombre} = nombre del socio)',
      valor:
        '¡Hola, {nombre}! 👋\n\nTe confirmamos que se ha tramitado correctamente tu baja como socio/a de Dragón de Madera 🐉\n\n' +
        'Gracias por todo el tiempo que has compartido con nosotros. Si algún día quieres volver, las puertas del club siguen abiertas.',
    },
  ]

  for (const config of configsIniciales) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
      update: config.clave === 'texto_bienvenida_alta' ? { valor: config.valor } : {}, // el texto de bienvenida se pisa siempre
      create: config,
    })
    console.log(`✓ Config "${config.clave}" asegurada`)
  }

  const existing = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } })

  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  if (existing) {
    console.log(`✓ Usuario admin ya existe (${ADMIN_EMAIL}) — no se modifica`)
  } else if (!adminPassword) {
    console.log('⚠️  SEED_ADMIN_PASSWORD no definida — no se crea el usuario admin')
  } else {

  const admin_hash = await bcrypt.hash(adminPassword, 12)

  await prisma.usuario.create({
    data: {
      email: ADMIN_EMAIL,
      password_hash: admin_hash,
      nombre: 'Admin',
      apellidos: 'Dragón de Madera',
      dni: '00000000A',
      roles: [Rol.administrador],
      estado: EstadoSocio.activo,
      tipo_cuota: TipoCuota.individual,
      consentimiento_tiendas: false,
      fecha_alta: new Date(),
    },
  })

    console.log(`✓ Usuario admin creado (${ADMIN_EMAIL})`)
    console.log(`  ⚠️  Cambia la contraseña tras el primer login`)
  }

  // ── Limpieza (orden por claves foráneas) ────────────────────────────────
  await prisma.$transaction([
    prisma.logJuego.deleteMany(),
    prisma.prestamo.deleteMany(),
    prisma.solicitudJuego.deleteMany(),
    prisma.juego.deleteMany(),
    prisma.visita.deleteMany(),
    prisma.pagoCuota.deleteMany(),
    prisma.historialEstadoSocio.deleteMany(),
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
  const admin = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } })
  const presi = await crear({ email: 'presidente@test.com', nombre: 'Lucía', apellidos: 'Fernández Ruiz', apodo: 'Lu', alias_telegram: 'lucia_fr', roles: [Rol.presidente], fecha_alta: haceDias(1200), tiene_llaves: true, aprobado_por_id: admin?.id })
  // Secretario con los datos del servidor de pruebas (conserva su contraseña y su vínculo de Telegram)
  const secre = await crear({
    email: '19matu91@gmail.com', password_hash: '$2a$12$F9daGhiN9iiWUQgmSHsTDemdBpCwPf.U25xmPZiWMU1CtF1FAJ7lW',
    nombre: 'Matu', apellidos: 'Matu>', telefono: '612345021', fecha_nacimiento: new Date('2006-05-12'),
    direccion: 'Calle Mayor 81, Alcalá de Henares', alias_telegram: '@MatuPoderoso', consentimiento_tiendas: false,
    telegram_chat_id: 381461939n, telegram_linked_at: new Date('2026-10-13T18:10:00.334'), llaves_solicitadas_at: new Date('2026-10-13T19:22:30.089'),
    roles: [Rol.secretario], fecha_alta: new Date('2025-09-08T17:51:00.244'), tiene_llaves: false, aprobado_por_id: presi.id,
  })
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

  // ── Cuota conjunta aprobada (madre + pareja + hijo) ─────────────────────
  const grupoOk = await prisma.solicitudGrupal.create({ data: { estado: 'aprobada', comprobante_transferencia: COMPROBANTE } })
  const famMadre = await crear({ email: 'familia.madre@test.com', nombre: 'Rosa', apellidos: 'Domínguez Soler', tipo_cuota: TipoCuota.conjunta, solicitud_grupal_id: grupoOk.id, fecha_alta: haceDias(400), aprobado_por_id: presi.id })
  const famPareja = await crear({ email: 'familia.pareja@test.com', nombre: 'Tomás', apellidos: 'Reyes Pastor', tipo_cuota: TipoCuota.conjunta, solicitud_grupal_id: grupoOk.id, fecha_alta: haceDias(400), aprobado_por_id: presi.id })
  const famHijo = await crear({ email: 'familia.hijo@test.com', nombre: 'Mario', apellidos: 'Reyes Domínguez', tipo_cuota: TipoCuota.conjunta, solicitud_grupal_id: grupoOk.id, fecha_alta: haceDias(400), fecha_nacimiento: new Date(2006, 4, 12), aprobado_por_id: presi.id })

  // ── Solicitudes pendientes (individuales + una conjunta) ────────────────
  await crear({ email: 'pendiente1@test.com', nombre: 'Alba', apellidos: 'Santos Ferrer', estado: EstadoSocio.pendiente, comprobante_transferencia: COMPROBANTE, alias_telegram: 'alba_sf' })
  await crear({ email: 'pendiente2@test.com', nombre: 'Gonzalo', apellidos: 'Vicente Arias', dni: 'X1234567L', estado: EstadoSocio.pendiente, comprobante_transferencia: COMPROBANTE })
  const grupoPend = await prisma.solicitudGrupal.create({ data: { comprobante_transferencia: COMPROBANTE } })
  await crear({ email: 'pendiente.conjunta@test.com', nombre: 'Beatriz', apellidos: 'Crespo Lara', tipo_cuota: TipoCuota.conjunta, estado: EstadoSocio.pendiente, solicitud_grupal_id: grupoPend.id })
  await crear({ email: 'pendiente.pareja@test.com', nombre: 'Rubén', apellidos: 'Ortiz Gallego', tipo_cuota: TipoCuota.conjunta, estado: EstadoSocio.pendiente, solicitud_grupal_id: grupoPend.id })

  // ── Bajas ───────────────────────────────────────────────────────────────
  const bajas = [
    await crear({ email: 'baja1@test.com', nombre: 'Fernando', apellidos: 'Calvo Bravo', estado: EstadoSocio.baja, fecha_alta: haceDias(800), fecha_baja: haceDias(120), aprobado_por_id: presi.id, baja_por_id: secre.id }),
    await crear({ email: 'baja2@test.com', nombre: 'Laura', apellidos: 'Pascual Rey', estado: EstadoSocio.baja, fecha_alta: haceDias(500), fecha_baja: haceDias(20), aprobado_por_id: secre.id, baja_por_id: presi.id }),
  ]

  // ── Historial de altas y bajas ──────────────────────────────────────────
  const activos = [presi, secre, teso, vocal, ludo, socio, ...basicos, famMadre, famPareja, famHijo]
  await prisma.historialEstadoSocio.createMany({ data: [
    ...[...activos, ...bajas].map((u) => ({ socio_id: u.id, tipo: 'alta' as const, por_id: u.aprobado_por_id, created_at: u.fecha_alta! })),
    ...bajas.map((u) => ({ socio_id: u.id, tipo: 'baja' as const, por_id: u.baja_por_id, created_at: u.fecha_baja! })),
  ] })

  // ── Cuotas: últimos 6 meses (la conjunta, una vez para el grupo) ────────
  const pagos: Prisma.PagoCuotaCreateManyInput[] = []
  const hoy = new Date()
  for (const [i, u] of activos.entries()) {
    if (u.solicitud_grupal_id && u.id !== famMadre.id) continue
    for (let m = 0; m < 6; m++) {
      const f = new Date(hoy.getFullYear(), hoy.getMonth() - m, 1)
      if (f < new Date(u.fecha_alta!.getFullYear(), u.fecha_alta!.getMonth(), 1)) break
      if (m === 0 && i % 3 === 0) continue // mes en curso sin revisar
      const impago = (m === 0 && i % 4 === 1) || (m === 1 && i % 5 === 2)
      const de = u.solicitud_grupal_id ? { grupo_id: u.solicitud_grupal_id } : { socio_id: u.id }
      pagos.push({ ...de, anio: f.getFullYear(), mes: f.getMonth() + 1, estado: impago ? 'sin_pagar' : 'pagado', revisado_por_id: teso.id })
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
  const propietarios = [ludo, basicos[2], basicos[7], famMadre]
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
    { socio_id: famMadre.id, nombre: 'Kingdomino', notas: 'Ideal para jugar con peques', created_at: haceDias(1) },
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


  console.log(`✓ Datos de prueba cargados. Contraseña de los usuarios de prueba: ${PASSWORD} (el admin conserva la suya)`)
  console.table([
    ['presidente@test.com', 'presidente'], ['19matu91@gmail.com', 'secretario (contraseña propia)'],
    ['tesorero@test.com', 'tesorero'], ['vocal@test.com', 'vocal'], ['ludotecario@test.com', 'ludotecario'],
    ['socio@test.com', 'socio (con préstamos)'], ['familia.madre@test.com', 'cuota conjunta'],
    ['pendiente1@test.com', 'pendiente (solo edita su solicitud)'], ['baja1@test.com', 'baja'],
  ].map(([email, perfil]) => ({ email, perfil })))
}

main()
  .catch((e) => {
    console.error('Error en seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
