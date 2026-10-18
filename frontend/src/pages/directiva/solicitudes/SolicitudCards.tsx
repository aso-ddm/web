import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sociosApi, type SocioListado } from '@/services/api/socios'
import { useAuthStore } from '@/store/authStore'
import { invalidarSocios } from '@/lib/queryKeys'
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog'
import type { SolicitudGrupal } from '@/types/api'
import { formatDate } from '@/lib/format'

// Tarjetas de solicitud de alta (individual y conjunta) con sus acciones

function abrirComprobante(socioId: string) {
  sociosApi.getComprobante(socioId).catch((err: Error) => toast.error(err.message))
}

function tipoCuotaLabel(tipo: string, precioIndividual: number) {
  return { individual: `Individual (${precioIndividual}€/mes)`, conjunta: 'Conjunta' }[tipo] ?? tipo
}

// ── Tarjeta solicitud individual ──────────────────────────────────────────────

export function AltaSolicitudCard({ socio, precioIndividual }: { socio: SocioListado; precioIndividual: number }) {
  const queryClient = useQueryClient()
  const puedeEditar = useAuthStore((s) => s.isDirectiva())
  const [confirmRechazo, setConfirmRechazo] = useState(false)
  const invalidar = () => invalidarSocios(queryClient)

  const { mutate: aprobar, isPending: aprobando } = useMutation({
    mutationFn: () => sociosApi.aprobar(socio.id),
    onSuccess: () => { toast.success(`Alta aprobada para ${socio.nombre} ${socio.apellidos}`); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: rechazar, isPending: rechazando } = useMutation({
    mutationFn: () => sociosApi.rechazar(socio.id),
    onSuccess: () => { toast.success('Solicitud rechazada'); setConfirmRechazo(false); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="py-4 border-b border-border last:border-0">
      <ConfirmDialog
        open={confirmRechazo}
        onOpenChange={setConfirmRechazo}
        title={`¿Rechazar la solicitud de ${socio.nombre} ${socio.apellidos}?`}
        description="No podrá acceder al área de socios. Si fue un error, tendrá que registrarse de nuevo."
        confirmLabel="Rechazar"
        onConfirm={() => rechazar()}
        pending={rechazando}
        destructive
      />
      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold">{socio.nombre} {socio.apellidos}</p>
            {socio.apodo && <span className="text-xs text-muted-foreground">({socio.apodo})</span>}
          </div>
          <p className="text-sm text-muted-foreground">{socio.email}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span>DNI: {socio.dni}</span>
            {socio.telefono && <span>Tel: {socio.telefono}</span>}
            {socio.fecha_nacimiento && <span>Nacimiento: {formatDate(socio.fecha_nacimiento)}</span>}
            <span>Cuota: {tipoCuotaLabel(socio.tipo_cuota, precioIndividual)}</span>
            <span>Solicitud: {formatDate(socio.created_at)}</span>
          </div>
          {socio.alias_telegram && (
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>Telegram: {socio.alias_telegram}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0 items-end">
          {puedeEditar && <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => aprobar()}
              disabled={aprobando || rechazando}
              className="font-display font-bold gap-1 h-9"
            >
              {aprobando ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Aprobar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmRechazo(true)} disabled={aprobando || rechazando} className="font-display h-9 text-destructive border-destructive/30 hover:bg-destructive/10">
              {rechazando ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
              Rechazar
            </Button>
          </div>}
          {socio.comprobante_transferencia ? (
            <Button
              size="sm"
              variant="ghost"
              className="font-display h-8 gap-1.5 text-xs text-secondary hover:text-secondary hover:bg-secondary/10"
              onClick={() => abrirComprobante(socio.id)}
            >
              <FileText className="h-3.5 w-3.5" />
              Ver comprobante
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground italic">Sin comprobante</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tarjeta solicitud conjunta ────────────────────────────────────────────────

export function GrupoSolicitudCard({ grupo, precioIndividual, precioAdicional }: { grupo: SolicitudGrupal; precioIndividual: number; precioAdicional: number }) {
  const queryClient = useQueryClient()
  const puedeEditar = useAuthStore((s) => s.isDirectiva())
  const [confirmRechazo, setConfirmRechazo] = useState(false)
  const invalidar = () => invalidarSocios(queryClient)

  const { mutate: aprobar, isPending: aprobando } = useMutation({
    mutationFn: () => sociosApi.aprobarGrupo(grupo.id),
    onSuccess: () => { toast.success(`Solicitud conjunta aprobada (${grupo.miembros.length} socios)`); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: rechazar, isPending: rechazando } = useMutation({
    mutationFn: () => sociosApi.rechazarGrupo(grupo.id),
    onSuccess: () => { toast.success('Solicitud conjunta rechazada'); setConfirmRechazo(false); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const precioTotal = precioIndividual + precioAdicional * (grupo.miembros.length - 1)

  return (
    <div className="py-4 border-b border-border last:border-0">
      <ConfirmDialog
        open={confirmRechazo}
        onOpenChange={setConfirmRechazo}
        title={`¿Rechazar la solicitud conjunta de ${grupo.miembros.map((m) => m.nombre).join(', ')}?`}
        description={`Se rechazarán los ${grupo.miembros.length} miembros del grupo.`}
        confirmLabel="Rechazar"
        onConfirm={() => rechazar()}
        pending={rechazando}
        destructive
      />
      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="space-y-3 pl-3 border-l-2 border-secondary/30">
            {grupo.miembros.map((miembro) => (
              <div key={miembro.id} className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-bold">{miembro.nombre} {miembro.apellidos}</p>
                  {miembro.apodo && <span className="text-xs text-muted-foreground">({miembro.apodo})</span>}
                </div>
                <p className="text-xs text-muted-foreground">{miembro.email} · DNI: {miembro.dni}</p>
                {miembro.alias_telegram && <p className="text-xs text-muted-foreground">Telegram: {miembro.alias_telegram}</p>}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Solicitud: {formatDate(grupo.created_at)}</p>

          {/* Precio total */}
          <p className="text-sm font-display font-bold text-secondary">
            {precioTotal}€/mes · {grupo.miembros.length} socios
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2 flex-shrink-0 items-end">
          {puedeEditar && <div className="flex gap-2">
            <Button size="sm" onClick={() => aprobar()} disabled={aprobando || rechazando} className="font-display font-bold gap-1 h-9">
              {aprobando ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Aprobar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmRechazo(true)} disabled={aprobando || rechazando} className="font-display h-9 text-destructive border-destructive/30 hover:bg-destructive/10">
              {rechazando ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
              Rechazar
            </Button>
          </div>}
          {grupo.comprobante_transferencia ? (
            <Button
              size="sm"
              variant="ghost"
              className="font-display h-8 gap-1.5 text-xs text-secondary hover:text-secondary hover:bg-secondary/10"
              onClick={() => abrirComprobante(grupo.miembros[0].id)}
            >
              <FileText className="h-3.5 w-3.5" />
              Ver comprobante
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground italic">Sin comprobante</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
