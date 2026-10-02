const TZ = 'Europe/Madrid'

const formato = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, hourCycle: 'h23',
  year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
})

function partes(date: Date) {
  const p = Object.fromEntries(formato.formatToParts(date).map((x) => [x.type, Number(x.value)]))
  return p as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>
}

/** 23:59:59.999 (hora de Madrid) del día de `date` más `sumarDias` días de calendario, sin depender del TZ del servidor */
export function finDelDiaMadrid(date: Date, sumarDias = 0): Date {
  const p = partes(date)
  const objetivo = Date.UTC(p.year, p.month - 1, p.day + sumarDias, 23, 59, 59, 999)
  const q = partes(new Date(objetivo))
  const offset = Date.UTC(q.year, q.month - 1, q.day, q.hour, q.minute, q.second, 999) - objetivo
  return new Date(objetivo - offset)
}
