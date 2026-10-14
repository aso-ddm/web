import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronRight, ChevronsUpDown, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog'
import { sociosApi, type SocioAdmin } from '@/services/api/socios'
import { invalidarSocios, QK } from '@/lib/queryKeys'
import { ESTADO_SOCIO_VARIANT } from '@/lib/estados'
import { cn } from '@/lib/utils'
import type { TipoRelacion } from '@/types/api'

/** Miembros de la cuota conjunta y paso entre cuota conjunta e individual (solo directiva). */
export function CuotaConjunta({ socio, puedeGestionar, onAbrirSocio }: {
  socio: SocioAdmin
  puedeGestionar: boolean
  onAbrirSocio: (id: string) => void
}) {
  const queryClient = useQueryClient()
  const grupo = socio.solicitud_grupal
  const gestionable = puedeGestionar && socio.estado === 'activo'
  const [confirmSalir, setConfirmSalir] = useState(false)
  const [uniendo, setUniendo] = useState(false)
  const [elegirAbierto, setElegirAbierto] = useState(false)
  const [otroId, setOtroId] = useState('')
  const [relacion, setRelacion] = useState<TipoRelacion>('pareja')

  const { data: opciones } = useQuery({
    queryKey: QK.SOCIOS_OPCIONES,
    queryFn: () => sociosApi.getOpciones(),
    enabled: uniendo,
  })
  const otros = (opciones?.data ?? []).filter((s) => s.id !== socio.id)
  const otro = otros.find((s) => s.id === otroId)

  // Tras el cambio, recargar la ficha para ver el grupo y el historial actualizados
  const recargar = () => {
    invalidarSocios(queryClient)
    onAbrirSocio(socio.id)
  }

  const { mutate: salir, isPending: saliendo } = useMutation({
    mutationFn: () => sociosApi.salirCuotaConjunta(socio.id),
    onSuccess: () => { toast.success(`${socio.nombre} pasa a cuota individual`); setConfirmSalir(false); recargar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: unir, isPending: guardando } = useMutation({
    mutationFn: () => sociosApi.unirCuotaConjunta(socio.id, otroId, relacion),
    onSuccess: () => { toast.success(`${socio.nombre} pasa a cuota conjunta`); recargar() },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <p className="font-display font-bold text-sm">{grupo ? 'Socios de la cuota conjunta' : 'Cuota conjunta'}</p>
      </div>

      {grupo ? (
        <>
          <ul className="space-y-1">
            {grupo.miembros.filter((m) => m.id !== socio.id).map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onAbrirSocio(m.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border hover:bg-accent/30 transition-colors text-left text-sm"
                >
                  <span className="flex-1 font-medium">
                    {m.nombre} {m.apellidos}
                    {m.id === grupo.titular_id && <span className="text-xs text-muted-foreground"> (titular)</span>}
                  </span>
                  <Badge variant={ESTADO_SOCIO_VARIANT[m.estado]} className="text-xs font-display capitalize">{m.estado}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
          {gestionable && (
            <Button size="sm" variant="outline" onClick={() => setConfirmSalir(true)} className="font-display">
              Pasar a cuota individual
            </Button>
          )}
        </>
      ) : !uniendo ? (
        <Button size="sm" variant="outline" onClick={() => setUniendo(true)} className="font-display">
          Pasar a cuota conjunta
        </Button>
      ) : (
        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-xs text-muted-foreground">
            Se une a la cuota conjunta del socio elegido. Si ese socio tiene cuota individual, se crea una conjunta con él como titular.
          </p>
          <Popover open={elegirAbierto} onOpenChange={setElegirAbierto} modal>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" role="combobox" aria-expanded={elegirAbierto} className="w-full justify-between font-normal">
                <span className={cn('truncate', !otro && 'text-muted-foreground')}>
                  {otro ? `${otro.nombre} ${otro.apellidos}` : 'Elegir socio…'}
                </span>
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar socio..." />
                <CommandList>
                  <CommandEmpty>Ningún socio coincide</CommandEmpty>
                  <CommandGroup>
                    {otros.map((s) => (
                      <CommandItem key={s.id} value={`${s.nombre} ${s.apellidos} ${s.apodo ?? ''} ${s.id}`} onSelect={() => { setOtroId(s.id); setElegirAbierto(false) }}>
                        {s.nombre} {s.apellidos}
                        <Check className={cn('ml-auto', otroId === s.id ? 'opacity-100' : 'opacity-0')} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Select value={relacion} onValueChange={(v) => setRelacion(v as TipoRelacion)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pareja">Pareja</SelectItem>
              <SelectItem value="familiar_directo">Familiar directo</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => unir()} disabled={!otroId || guardando} className="font-display font-bold">
              {guardando && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Unir a la cuota
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setUniendo(false)} className="font-display">Cancelar</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmSalir}
        onOpenChange={setConfirmSalir}
        title={`¿Pasar a ${socio.nombre} ${socio.apellidos} a cuota individual?`}
        description={
          grupo && grupo.miembros.length <= 2
            ? 'Se lleva una copia del historial de pagos. La cuota conjunta se disuelve y el otro miembro también pasa a individual.'
            : grupo?.titular_id === socio.id
              ? 'Se lleva una copia del historial de pagos. La titularidad pasa al siguiente miembro de la cuota.'
              : 'Se lleva una copia del historial de pagos de la cuota conjunta.'
        }
        confirmLabel="Pasar a individual"
        onConfirm={() => salir()}
        pending={saliendo}
      />
    </div>
  )
}
