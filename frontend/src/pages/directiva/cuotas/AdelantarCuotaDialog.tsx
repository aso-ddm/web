import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { cuotasApi } from '@/services/api/cuotas'
import { mesAbs } from '@/lib/cuotas'
import { QK } from '@/lib/queryKeys'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const RAPIDOS = [[3, '3 meses'], [6, '6 meses'], [12, '1 año'], [24, '2 años']] as const

interface Props {
  // Basta un socio de la cuota: en una conjunta el backend lo apunta en el grupo
  cuota: { socioId: string; nombres: string } | null
  onClose: () => void
}

// Pago de varios meses de golpe (normalmente por adelantado): los marca todos como pagados desde el mes elegido
export function AdelantarCuotaDialog({ cuota, onClose }: Props) {
  const qc = useQueryClient()
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [meses, setMeses] = useState(12)
  const valido = Number.isInteger(meses) && meses >= 1 && meses <= 36
  const fin = mesAbs(anio, mes) + meses - 1
  const hasta = `${MESES[fin % 12]} ${Math.floor(fin / 12)}`

  const { mutate, isPending } = useMutation({
    mutationFn: () => cuotasApi.adelantar(cuota!.socioId, anio, mes, meses),
    // Mismo scope que los clics de la rejilla: no se cruza con un PUT pendiente
    scope: { id: 'cuotas' },
    onSuccess: () => {
      toast.success(`Pago registrado de ${MESES[mes - 1]} ${anio} a ${hasta}`)
      qc.invalidateQueries({ queryKey: QK.CUOTAS })
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={!!cuota} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Registrar pago de varios meses</DialogTitle>
          <DialogDescription>
            {cuota?.nombres}. Todos los meses del periodo quedan como pago realizado, incluidos los que
            estuvieran marcados como no pagados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="font-display text-sm">Desde</Label>
            <div className="mt-1 flex gap-2">
              <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                <SelectTrigger className="w-28" aria-label="Mes de inicio"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
                <SelectTrigger className="w-28" aria-label="Año de inicio"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[-1, 0, 1, 2].map((d) => hoy.getFullYear() + d).map((a) => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="meses-pagados" className="font-display text-sm">Meses pagados</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              <Input
                id="meses-pagados"
                type="number"
                min={1}
                max={36}
                value={Number.isNaN(meses) ? '' : meses}
                onChange={(e) => setMeses(e.target.valueAsNumber)}
                className="w-20"
              />
              {RAPIDOS.map(([n, texto]) => (
                <Button key={n} type="button" size="sm" variant={meses === n ? 'default' : 'outline'} onClick={() => setMeses(n)}>
                  {texto}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {valido ? `De ${MESES[mes - 1]} ${anio} a ${hasta}` : 'Entre 1 y 36 meses'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="font-display">Cancelar</Button>
          <Button onClick={() => mutate()} disabled={isPending || !valido} className="font-display">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
