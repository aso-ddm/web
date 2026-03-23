/**
 * Calcula el precio mensual de la cuota conjunta.
 * @param numMiembrosAdicionales Número de miembros adicionales (0-5)
 * @returns Precio total en euros por mes
 */
export function calcularPrecio(numMiembrosAdicionales: number): number {
  return 15 + 5 * numMiembrosAdicionales
}
