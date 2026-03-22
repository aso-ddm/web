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
    return
  }

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

main()
  .catch((e) => {
    console.error('Error en seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
