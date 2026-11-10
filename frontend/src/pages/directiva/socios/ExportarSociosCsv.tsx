import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { sociosApi, type GetSociosParams, type SocioExport } from '@/services/api/socios'
import { getRolLabel } from '@/lib/roles'
import { useAuthStore } from '@/store/authStore'
import { toCsv, descargarCsv } from '@/lib/csv'

const fecha = (v?: string | null) => (v ? v.slice(0, 10) : '')
const siNo = (v: boolean) => (v ? 'Sí' : 'No')
const persona = (p: { nombre: string; apellidos: string } | null) => (p ? `${p.nombre} ${p.apellidos}` : '')

const CAMPOS: { id: string; titulo: string; valor: (s: SocioExport) => unknown; soloDirectiva?: boolean }[] = [
  { id: 'nombre', titulo: 'Nombre', valor: (s) => s.nombre },
  { id: 'apellidos', titulo: 'Apellidos', valor: (s) => s.apellidos },
  { id: 'apodo', titulo: 'Apodo', valor: (s) => s.apodo },
  { id: 'email', titulo: 'Email', valor: (s) => s.email },
  { id: 'dni', titulo: 'DNI', valor: (s) => s.dni },
  { id: 'telefono', titulo: 'Teléfono', valor: (s) => s.telefono },
  { id: 'fecha_nacimiento', titulo: 'Fecha de nacimiento', valor: (s) => fecha(s.fecha_nacimiento) },
  { id: 'alias_telegram', titulo: 'Alias de Telegram', valor: (s) => s.alias_telegram },
  { id: 'direccion', titulo: 'Dirección', valor: (s) => s.direccion },
  { id: 'telegram', titulo: 'Telegram vinculado', valor: (s) => siNo(!!s.telegram_chat_id) },
  { id: 'telegram_linked_at', titulo: 'Fecha de vinculación de Telegram', valor: (s) => fecha(s.telegram_linked_at) },
  { id: 'consentimiento_tiendas', titulo: 'Consentimiento tiendas', valor: (s) => siNo(s.consentimiento_tiendas) },
  { id: 'estado', titulo: 'Estado', valor: (s) => s.estado },
  { id: 'cargos', titulo: 'Cargos', valor: (s) => s.roles.filter((r) => r !== 'socio_basico').map(getRolLabel).join(', ') },
  { id: 'tipo_cuota', titulo: 'Tipo de cuota', valor: (s) => s.tipo_cuota },
  {
    id: 'cuota_conjunta',
    titulo: 'Cuota conjunta con',
    valor: (s) => s.solicitud_grupal?.miembros.map(persona).filter((n) => n !== persona(s)).join(', '),
  },
  { id: 'comprobante', titulo: 'Comprobante adjunto', valor: (s) => siNo(!!s.comprobante_transferencia) },
  { id: 'llaves', titulo: 'Llaves', valor: (s) => siNo(s.tiene_llaves) },
  { id: 'llaves_solicitadas_at', titulo: 'Fecha de solicitud de llaves', valor: (s) => fecha(s.llaves_solicitadas_at) },
  { id: 'fecha_alta', titulo: 'Fecha de alta', valor: (s) => fecha(s.fecha_alta) },
  { id: 'aprobado_por', titulo: 'Alta aprobada por', valor: (s) => persona(s.aprobado_por) },
  { id: 'fecha_baja', titulo: 'Fecha de baja', valor: (s) => fecha(s.fecha_baja) },
  { id: 'baja_por', titulo: 'Baja tramitada por', valor: (s) => persona(s.baja_por) },
  { id: 'created_at', titulo: 'Fecha de solicitud', valor: (s) => fecha(s.created_at) },
  { id: 'updated_at', titulo: 'Última modificación', valor: (s) => fecha(s.updated_at) },
  { id: 'anotaciones', titulo: 'Anotaciones', valor: (s) => s.anotaciones, soloDirectiva: true },
  { id: 'id', titulo: 'ID', valor: (s) => s.id },
]
const POR_DEFECTO = ['nombre', 'apellidos', 'email', 'telefono', 'estado']

/** Exporta los socios del filtro actual (mismo GET /socios: el backend ya oculta las bajas a quien no puede verlas). */
export function ExportarSociosCsv({ filtros }: { filtros: Pick<GetSociosParams, 'search' | 'estado'> }) {
  const esDirectiva = useAuthStore((s) => s.isDirectiva())
  const campos = CAMPOS.filter((c) => esDirectiva || !c.soloDirectiva) // el backend tampoco las da a los vocales
  const [open, setOpen] = useState(false)
  const [elegidos, setElegidos] = useState<string[]>(POR_DEFECTO)
  const [cargando, setCargando] = useState(false)

  const toggle = (id: string, on: boolean) =>
    setElegidos((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)))

  const exportar = async () => {
    setCargando(true)
    try {
      const socios: SocioExport[] = []
      for (let page = 1, total = 1; page <= total; page++) {
        const r = await sociosApi.getAllCompleto({ ...filtros, page, limit: 500 })
        socios.push(...r.data)
        total = r.totalPages
      }
      const columnas = campos.filter((c) => elegidos.includes(c.id)) // orden fijo, no el de selección
      descargarCsv(`socios-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(socios, columnas))
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al exportar CSV')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Download className="h-4 w-4" /> Exportar CSV
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar socios a CSV</DialogTitle>
            <DialogDescription>Se exportan los socios del filtro y la búsqueda actuales. Elige las columnas.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 text-sm">
            <button type="button" className="underline" onClick={() => setElegidos(campos.map((c) => c.id))}>Todos</button>
            <button type="button" className="underline" onClick={() => setElegidos([])}>Ninguno</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {campos.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={elegidos.includes(c.id)} onCheckedChange={(v) => toggle(c.id, v === true)} />
                {c.titulo}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={exportar} disabled={cargando || elegidos.length === 0} className="gap-2">
              {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
