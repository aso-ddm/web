import { Prisma, PrismaClient } from '@prisma/client'

/** Texto sin tildes ni nada que no sea letra o número (espacios, puntuación…); ILIKE ignora mayúsculas */
const sinSignos = (sql: Prisma.Sql) => Prisma.sql`regexp_replace(unaccent(${sql}), '[^[:alnum:]]+', '', 'g')`

/**
 * `columna` contiene `search` sin distinguir mayúsculas, tildes ni signos: "catan ciudades" encuentra "Catán: Ciudades".
 * Como la búsqueda se queda sin signos, % y _ desaparecen y no hace falta escaparlos.
 */
export function coincide(columna: string, search: string) {
  return Prisma.sql`${sinSignos(Prisma.raw(columna))} ILIKE '%' || ${sinSignos(Prisma.sql`${search}`)} || '%'`
}

/**
 * Busca usuarios por nombre y apellidos, apodo, email o DNI (ver `coincide`).
 * Devuelve los ids de la página pedida y el total; cada llamante carga sus campos con findMany.
 */
export async function buscarIdsUsuarios(
  prisma: PrismaClient,
  { search, estado, tieneLlaves, conTelegram, sinBajas, limit, skip }:
    { search: string; estado?: string; tieneLlaves?: boolean; conTelegram?: boolean; sinBajas?: boolean; limit: number; skip: number },
) {
  const where = Prisma.sql`
    WHERE (
      ${coincide(`concat_ws(' ', nombre, apellidos)`, search)}
      OR ${coincide('email', search)}
      OR ${coincide('dni', search)}
      OR ${coincide('apodo', search)}
    )
    ${estado ? Prisma.sql`AND estado::text = ${estado}` : Prisma.empty}
    ${sinBajas ? Prisma.sql`AND estado::text <> 'baja'` : Prisma.empty}
    ${tieneLlaves !== undefined ? Prisma.sql`AND tiene_llaves = ${tieneLlaves}` : Prisma.empty}
    ${conTelegram !== undefined ? (conTelegram ? Prisma.sql`AND telegram_chat_id IS NOT NULL` : Prisma.sql`AND telegram_chat_id IS NULL`) : Prisma.empty}
  `
  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Usuario" ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${skip}`,
    prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM "Usuario" ${where}`,
  ])
  return { ids: rows.map((r) => r.id), total: Number(countRows[0]?.count ?? 0) }
}
