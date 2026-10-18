import type { ReactNode } from 'react'
import { Mail, Phone, IdCard, Send, CalendarDays } from 'lucide-react'
import { formatDate } from '@/lib/format'
import type { SocioListado } from '@/services/api/socios'

type Datos = Pick<SocioListado, 'email' | 'dni' | 'telefono' | 'alias_telegram' | 'telegram_chat_id' | 'estado' | 'fecha_alta' | 'fecha_baja' | 'created_at'>

function Dato({ icon, title, children, className = '' }: { icon: ReactNode; title: string; children: ReactNode; className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 min-w-0 ${className}`} title={title}>
      {icon}
      <span className="truncate">{children}</span>
    </span>
  )
}

function fechaEstado(s: Datos) {
  if (s.estado === 'baja') return `Baja ${formatDate(s.fecha_baja)}`
  if (s.estado === 'pendiente') return `Solicitud ${formatDate(s.created_at)}`
  return `Alta ${formatDate(s.fecha_alta)}`
}

/** Datos de contacto e identificación de un socio en celdas fijas ("—" si falta) para que las filas se alineen.
 *  En móvil solo email, teléfono y Telegram; DNI y fecha desde sm. */
export function SocioDatos({ socio }: { socio: Datos }) {
  const ico = 'h-3 w-3 shrink-0'
  const telegram = socio.alias_telegram || (socio.telegram_chat_id ? 'Vinculado' : '—')
  return (
    <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
      <Dato icon={<Mail className={ico} />} title={socio.email} className="col-span-2 sm:col-span-1">{socio.email}</Dato>
      <Dato icon={<Phone className={ico} />} title="Teléfono">{socio.telefono || '—'}</Dato>
      <Dato icon={<Send className={ico} />} title={socio.telegram_chat_id ? 'Telegram vinculado' : 'Telegram sin vincular'}>{telegram}</Dato>
      <Dato icon={<IdCard className={ico} />} title="DNI" className="hidden sm:flex">{socio.dni}</Dato>
      <Dato icon={<CalendarDays className={ico} />} title="Fecha" className="hidden sm:flex">{fechaEstado(socio)}</Dato>
    </div>
  )
}
