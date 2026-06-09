/**
 * Seed: crea el usuario administrador base si no existe.
 * Ejecutar: npm run seed
 *
 * Credenciales por defecto (CAMBIAR EN PRODUCCIÓN):
 *   Email:    admin@dragondemadera.com
 *   Password: DragonAdmin2026!
 */
import 'dotenv/config'
import { PrismaClient, Rol, EstadoSocio, TipoCuota } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@dragondemadera.com'

  const existing = await prisma.usuario.findUnique({ where: { email } })

  if (existing) {
    console.log(`✓ Usuario admin ya existe (${email}) — no se modifica`)
  } else {

  const password_hash = await bcrypt.hash('DragonAdmin2026!', 12)

  const admin = await prisma.usuario.create({
    data: {
      email,
      password_hash,
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

    console.log(`✓ Usuario admin creado:`)
    console.log(`  ID:    ${admin.id}`)
    console.log(`  Email: ${admin.email}`)
    console.log(`  Roles: ${admin.roles.join(', ')}`)
    console.log(`  ⚠️  Cambia la contraseña tras el primer login`)
  }

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
      valor: `Dragón de Madera - Alta de nuevo socio
¡Bienvenid@!

Este formulario es para que conozcas algunas cosas importantes de la asociación y para tener tus datos que serán tratados con la privacidad y el respeto pertinente.

**IDENTIDAD**
¡Bienvenid@ al Dragón! Somos una asociación cultural sin ánimo de lucro que fomenta el ocio a través de los juegos de mesa.

Recuerda que debes realizar una transferencia periódica (entre el día 1 y el 15) a la cuenta con IBAN ES4730230180596406354008 de la cuota mensual.

Para formalizar el alta haz una transferencia de la parte proporcional de días que quedan del mes de tu tipo de cuota más la cantidad íntegra de tu cuota en concepto de matrícula.

**FORMAR PARTE**
Para estar al tanto de lo que sucede en la asociación hemos creado varios canales y un chat de Telegram. Instala la aplicación y serás agregado cuando procesemos el alta.

**PONER DE TU PARTE**

Llaves -> Cualquier socio que sea miembro del club durante 6 meses ininterrumpidos y que cumpla la normativa vigente puede solicitar a la junta directiva la cesión de las llaves del local, mientras tanto puedes organizarte con otros socios para abrir el local cuando lo necesites o pedirlas prestadas puntualmente.

Invitados -> Es importante estar atento y anotar a los invitados que acudan al club para así contabilizar las visitas, o bien la aportación que realicen en la entrada de día. Además, somos los responsables de velar por el bienestar del local ante cualquier invitados. Esto es: Atender el bar cuando algún invitado quiera consumir, vigilar el comportamiento de estos con el material e instalaciones, y explicarle cómo funciona el club o cualquier otra cosa que necesiten.

Alias en telegram -> La asociación usa la aplicación Telegram para comunicarse y gestionar algunas cosas (como las partidas), cuando te registres, recuerda incluir tu alias. Si no tienes claro cómo, este vídeo te lo aclara:
https://www.youtube.com/watch?v=oz3WsDk7hTM&feature=youtu.be

**ESTATUTOS Y REGLAMENTO INTERNO**
En este formulario se ha presentado un resumen de la información relevante sobre el club. Puedes consultar los documentos oficiales con los botones que aparecen a continuación.

**¿DESEAS SABER MÁS?**
Para cualquier duda o comentario nos encontrarás en info@dragondemadera.com o escribiéndonos por Telegram a @dragondemadera_info`,
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
      clave: 'url_telegram_principal',
      valor: '',
      tipo: 'url',
      descripcion: 'Enlace de invitación al grupo principal de Telegram del club',
    },
    {
      clave: 'url_telegram_partidas',
      valor: '',
      tipo: 'url',
      descripcion: 'Enlace de invitación al grupo de Telegram de organización de partidas',
    },
    {
      clave: 'iban_club',
      valor: 'ES4730230180596406354008',
      tipo: 'texto',
      descripcion: 'IBAN de la cuenta bancaria del club para pagos de cuotas',
    },
    {
      clave: 'texto_consentimiento_tiendas',
      tipo: 'texto_largo',
      descripcion: 'Texto del checkbox de consentimiento de datos con tiendas colaboradoras (visible en el formulario de alta)',
      valor: 'Acepto que se compartan mis datos (nombre y apellidos) con las tiendas colaboradoras de la asociación (FreakMondo, Bazar de Iglesias, Dune) para poder beneficiarme del descuento del 10% en compras como socio de Dragón de Madera.',
    },
  ]

  for (const config of configsIniciales) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
      update: {},
      create: config,
    })
    console.log(`✓ Config "${config.clave}" asegurada`)
  }
}

main()
  .catch((e) => {
    console.error('Error en seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
