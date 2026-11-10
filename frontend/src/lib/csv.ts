/** CSV con `;` (Excel en español lo abre por columnas) y BOM para los acentos. */
export function toCsv<T>(filas: T[], columnas: { titulo: string; valor: (f: T) => unknown }[]): string {
  const celda = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lineas = [columnas.map((c) => celda(c.titulo)), ...filas.map((f) => columnas.map((c) => celda(c.valor(f))))]
  return '﻿' + lineas.map((l) => l.join(';')).join('\r\n')
}

export function descargarCsv(nombre: string, csv: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
}
