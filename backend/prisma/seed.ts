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
import bcrypt from 'bcrypt'

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
      roles: [Rol.presidente],
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
      clave: 'visitas_gratuitas',
      valor: '3',
      tipo: 'numero',
      descripcion: 'Número de visitas gratuitas permitidas para no socios antes de tener que pagar',
    },
    {
      clave: 'precio_visita_pago',
      valor: '2',
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
En este formulario se ha presentado un resumen de la información relevante sobre el club, aquí tienes los enlaces para revisar los estatutos (https://drive.google.com/open?id=1fH9TtVtbQnvSQ1U7ADLpitaYkbKDgqlj) y el reglamento interno https://drive.google.com/file/d/10vatk-00LMMJt0wz-2phnqDjRMHWzvyR si quieres disponer de toda la información.

**¿DESEAS SABER MÁS?**
Para cualquier duda o comentario nos encontrarás en info@dragondemadera.com o escribiéndonos por Telegram a @dragondemadera_info`,
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
