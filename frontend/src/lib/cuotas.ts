export type EstadoPago = 'pagado' | 'sin_pagar'
export interface PagoMes { anio: number; mes: number; estado: EstadoPago }

// Mes como número absoluto para comparar y contar rangos
export const mesAbs = (anio: number, mes: number) => anio * 12 + (mes - 1)
const mesAbsFecha = (d: Date) => mesAbs(d.getFullYear(), d.getMonth() + 1)

// ¿El mes cae dentro del periodo de socio (desde el alta hasta el mes actual)?
export function mesEnPeriodo(fechaAlta: string, anio: number, mes: number, hoy = new Date()) {
  const m = mesAbs(anio, mes)
  return m >= mesAbsFecha(new Date(fechaAlta)) && m <= mesAbsFecha(hoy)
}

// Moroso: algún mes de su periodo marcado como pago no realizado
export function esMoroso(fechaAlta: string, pagos: PagoMes[], hoy = new Date()) {
  return pagos.some((p) => p.estado === 'sin_pagar' && mesEnPeriodo(fechaAlta, p.anio, p.mes, hoy))
}
