import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bot, CheckCircle2, Loader2, RotateCw, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SEOHead } from '@/components/atoms/SEOHead'
import { telegramAdminApi, type FiltrosLog, type TelegramLog } from '@/services/api/telegram'
import { QK } from '@/lib/queryKeys'

const CONTEXTO_LABELS: Record<string, string> = {
  anuncio: 'Anuncio',
  bienvenida: 'Bienvenida (directiva)',
  bienvenida_vinculacion: 'Bienvenida al vincular',
  aviso_alta: 'Aviso de alta al secretario',
  solicitud_llaves: 'Solicitud de llaves',
  solicitud_baja: 'Solicitud de baja',
  aviso_baja: 'Aviso de baja al socio',
  reset_password: 'Recuperar contraseña',
  webhook: 'Respuesta a botón',
}
const contextoLabel = (c: string) => CONTEXTO_LABELS[c] ?? c

const formatFechaHora = (d: string) =>
  new Date(d).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function EstadoBot() {
  const { data, isLoading } = useQuery({ queryKey: QK.TELEGRAM_ESTADO, queryFn: telegramAdminApi.getEstado })
  if (isLoading) return <Skeleton className="h-28 w-full" />
  if (!data) return null
  const { me, webhook } = data.data
  const wh = webhook.result as { url?: string; pending_update_count?: number; last_error_date?: number; last_error_message?: string } | undefined
  const fila = (ok: boolean, texto: React.ReactNode) => (
    <div className="flex items-start gap-2 text-sm">
      {ok ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
      <span className="min-w-0 break-words">{texto}</span>
    </div>
  )
  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        {fila(me.ok, me.ok ? <>Bot <b>@{String(me.result?.username)}</b> responde</> : <>Token no válido: {me.description}</>)}
        {fila(!!wh?.url, wh?.url ? <>Webhook: <span className="text-muted-foreground">{wh.url}</span></> : 'Sin webhook configurado: el bot no recibe mensajes')}
        {wh && fila(!wh.pending_update_count, `${wh.pending_update_count ?? 0} actualizaciones pendientes de entregar`)}
        {wh?.last_error_message && fila(false, <>Último error al entregar el webhook ({formatFechaHora(new Date(wh.last_error_date! * 1000).toISOString())}): {wh.last_error_message}</>)}
      </CardContent>
    </Card>
  )
}

function LogDetalle({ log, onClose }: { log: TelegramLog; onClose: () => void }) {
  const queryClient = useQueryClient()
  const payload = log.payload as { params?: unknown } | null
  const reintentable = log.direccion === 'envio' && !!payload?.params

  const { mutate: reintentar, isPending } = useMutation({
    mutationFn: () => telegramAdminApi.reintentar(log.id),
    onSuccess: () => { toast.success('Mensaje reenviado'); onClose() },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QK.TELEGRAM_LOGS }),
  })

  return (
    <div className="space-y-4 text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted-foreground">Fecha</dt><dd>{formatFechaHora(log.created_at)}</dd>
        <dt className="text-muted-foreground">Tipo</dt><dd>{log.direccion === 'envio' ? 'Envío' : 'Recepción'} · {log.metodo}</dd>
        <dt className="text-muted-foreground">Acción</dt><dd>{contextoLabel(log.contexto)}</dd>
        <dt className="text-muted-foreground">Chat</dt><dd>{log.chat_id ?? '—'}</dd>
        {log.reintentado_at && <><dt className="text-muted-foreground">Reenviado</dt><dd>{formatFechaHora(log.reintentado_at)}</dd></>}
      </dl>
      <div>
        <Label className="font-display">Error</Label>
        <p className="mt-1 rounded-md bg-destructive/10 text-destructive p-3 break-words">{log.error}</p>
      </div>
      <div>
        <Label className="font-display">Contenido</Label>
        {log.payload ? (
          <pre className="mt-1 rounded-md bg-muted p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(log.payload, null, 2)}
          </pre>
        ) : (
          <p className="mt-1 text-muted-foreground">No se guarda (mensaje con datos sensibles).</p>
        )}
      </div>
      {reintentable && (
        <Button onClick={() => reintentar()} disabled={isPending} className="w-full">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          {log.reintentado_at ? 'Reenviar otra vez' : 'Reenviar'}
        </Button>
      )}
    </div>
  )
}

export function AdminTelegramPage() {
  const [filtros, setFiltros] = useState<FiltrosLog>({ page: 1 })
  const [seleccionado, setSeleccionado] = useState<TelegramLog | null>(null)
  const filtrar = (cambio: Partial<FiltrosLog>) => setFiltros((f) => ({ ...f, ...cambio, page: 1 }))

  const { data, isLoading } = useQuery({
    queryKey: QK.TELEGRAM_LOGS_FILTRO(filtros),
    queryFn: () => telegramAdminApi.getLogs(filtros),
    placeholderData: keepPreviousData,
  })
  const logs = data?.data ?? []
  const pag = data

  return (
    <>
      <SEOHead title="Admin — Bot de Telegram" description="Estado y errores del bot de Telegram" path="/admin/telegram" noindex />

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bot className="h-5 w-5 text-primary" />
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Logs bot de Telegram</h1>
          </div>
          <p className="text-muted-foreground">
            Errores al enviar o recibir mensajes de los últimos 90 días{pag ? ` · ${pag.total} en total` : ''}
          </p>
        </div>

        <EstadoBot />

        {/* Filtros */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Select value={filtros.direccion ?? 'todos'} onValueChange={(v) => filtrar({ direccion: v === 'todos' ? undefined : v as 'envio' | 'recepcion' })}>
            <SelectTrigger className="w-full font-display"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="font-display">Envío y recepción</SelectItem>
              <SelectItem value="envio" className="font-display">Envío</SelectItem>
              <SelectItem value="recepcion" className="font-display">Recepción</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtros.contexto ?? 'todos'} onValueChange={(v) => filtrar({ contexto: v === 'todos' ? undefined : v })}>
            <SelectTrigger className="w-full font-display"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="font-display">Todas las acciones</SelectItem>
              {data?.contextos.map((c) => <SelectItem key={c} value={c} className="font-display">{contextoLabel(c)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" aria-label="Desde" value={filtros.desde ?? ''} onChange={(e) => filtrar({ desde: e.target.value || undefined })} />
          <Input type="date" aria-label="Hasta" value={filtros.hasta ?? ''} onChange={(e) => filtrar({ hasta: e.target.value || undefined })} />
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">Sin errores registrados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <button
                key={log.id}
                type="button"
                onClick={() => setSeleccionado(log)}
                className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent hover:border-border hover:bg-accent/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-bold truncate">{contextoLabel(log.contexto)}</p>
                  <p className="text-xs text-destructive truncate">{log.error}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">{formatFechaHora(log.created_at)}</span>
                  <div className="flex gap-1">
                    {log.reintentado_at && <Badge variant="secondary" className="text-xs">Reenviado</Badge>}
                    <Badge variant="outline" className="text-xs">{log.direccion === 'envio' ? 'Envío' : 'Recepción'}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Paginación */}
        {pag && pag.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled={filtros.page <= 1} onClick={() => setFiltros((f) => ({ ...f, page: f.page - 1 }))}>Anterior</Button>
            <span className="px-3 py-1.5 text-sm text-muted-foreground font-display">{filtros.page} / {pag.totalPages}</span>
            <Button variant="outline" size="sm" disabled={filtros.page >= pag.totalPages} onClick={() => setFiltros((f) => ({ ...f, page: f.page + 1 }))}>Siguiente</Button>
          </div>
        )}
      </div>

      <Sheet open={!!seleccionado} onOpenChange={(v) => !v && setSeleccionado(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {seleccionado && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-primary">{contextoLabel(seleccionado.contexto)}</SheetTitle>
                <SheetDescription>Detalle del error</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">
                <LogDetalle log={seleccionado} onClose={() => setSeleccionado(null)} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
