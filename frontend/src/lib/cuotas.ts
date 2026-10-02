export type EstadoPago = 'pagado' | 'sin_pagar'
export type Situacion = 'moroso' | 'pendiente' | 'al_corriente'
export interface PagoMes { anio: number; mes: number; estado: EstadoPago }

// Mes como número absoluto para comparar y contar rangos
export const mesAbs = (anio: number, mes: number) => anio * 12 + (mes - 1)
const mesAbsFecha = (d: Date) => mesAbs(d.getFullYear(), d.getMonth() + 1)

// ¿El mes cae dentro del periodo de socio (desde el alta hasta el mes actual)?
export function mesEnPeriodo(fechaAlta: string, anio: number, mes: number, hoy = new Date()) {
  const m = mesAbs(anio, mes)
  return m >= mesAbsFecha(new Date(fechaAlta)) && m <= mesAbsFecha(hoy)
}

// Moroso: algún mes sin pagar. Pendiente: algún mes sin revisar. Al corriente: todo pagado.
export function situacion(fechaAlta: string, pagos: PagoMes[], hoy = new Date()): Situacion {
  const enPeriodo = pagos.filter((p) => mesEnPeriodo(fechaAlta, p.anio, p.mes, hoy))
  if (enPeriodo.some((p) => p.estado === 'sin_pagar')) return 'moroso'
  const meses = mesAbsFecha(hoy) - mesAbsFecha(new Date(fechaAlta)) + 1
  return enPeriodo.length < meses ? 'pendiente' : 'al_corriente'
}
