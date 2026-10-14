import crypto from 'node:crypto'

/** Compara secretos en tiempo constante (firmas, tokens): `===` deja medir cuántos caracteres coinciden. */
export function igualesSeguro(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}
