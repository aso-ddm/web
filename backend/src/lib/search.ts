import { Prisma, PrismaClient } from '@prisma/client'

/** Patrón ILIKE "contiene": escapa % y _ para que el usuario no pueda usarlos como comodines */
export function likePattern(search: string) {
  return `%${search.replace(/[\\%_]/g, '\\$&')}%`
}

/**
 * Busca usuarios por nombre, apellidos, apodo (sin tildes), email o DNI.
 * Devuelve los ids de la página pedida y el total; cada llamante carga sus campos con findMany.
 */
export async function buscarIdsUsuarios(
  prisma: PrismaClient,
  { search, estado, limit, skip }: { search: string; estado?: string; limit: number; skip: number },
) {
  const pattern = likePattern(search)
  const where = Prisma.sql`
    WHERE (
      unaccent(nombre) ILIKE unaccent(${pattern})
      OR unaccent(apellidos) ILIKE unaccent(${pattern})
      OR email ILIKE ${pattern}
      OR dni ILIKE ${pattern}
      OR unaccent(apodo) ILIKE unaccent(${pattern})
    )
    ${estado ? Prisma.sql`AND estado::text = ${estado}` : Prisma.empty}
  `
  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Usuario" ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${skip}`,
    prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM "Usuario" ${where}`,
  ])
  return { ids: rows.map((r) => r.id), total: Number(countRows[0]?.count ?? 0) }
}
