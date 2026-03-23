/**
 * Calcula el precio mensual de la cuota.
 * @param numMiembrosAdicionales Número de miembros adicionales (0-5)
 * @param precioIndividual Precio base del titular (por defecto 15€)
 * @param precioAdicional Precio por cada miembro adicional (por defecto 5€)
 */
export function calcularPrecio(
  numMiembrosAdicionales: number,
  precioIndividual = 15,
  precioAdicional = 5,
): number {
  return precioIndividual + precioAdicional * numMiembrosAdicionales
}
