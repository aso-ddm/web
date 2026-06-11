import { useState, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, Loader2, MessageCircle, Wallet, Search, X, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SEOHead } from '@/components/SEOHead'
import { api } from '@/services/api/client'
import { useAuthStore } from '@/store/authStore'
import { sociosApi } from '@/services/api/socios'
import type { Rol } from '@/types/api'

const ROL_LABELS: Record<Rol, string> = {
  administrador: 'Administrador',
  presidente: 'Presidente',
  secretario: 'Secretario/a',
  tesorero: 'Tesorero/a',
  vocal: 'Vocal',
  ludotecario: 'Ludotecario/a',
  socio_basico: 'Socio/a',
}

const ROLES_FILTRO: Rol[] = ['presidente', 'secretario', 'tesorero', 'vocal', 'ludotecario', 'socio_basico']

interface AnuncioResult {
  enviados: number
  errores: number
  total: number
}

export function AnunciosPage() {
  const { isDirectiva } = useAuthStore()
  const [mensaje, setMensaje] = useState('')
  const [confirmAnuncio, setConfirmAnuncio] = useState(false)
  const [confirmPago, setConfirmPago] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [modoTodos, setModoTodos] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeRoles, setActiveRoles] = useState<Set<Rol>>(new Set())

  const { data: sociosData } = useQuery({
    queryKey: ['socios-destinatarios'],
    queryFn: () => sociosApi.getAll({ estado: 'activo', limit: 500 }),
    staleTime: 1000 * 60 * 5,
  })

  const sociosConTelegram = useMemo(
    () =>
      (sociosData?.data ?? []).filter(
        (s) => s.telegram_chat_id && !s.roles.includes('administrador'),
      ),
    [sociosData],
  )

  const sociosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return sociosConTelegram
    const q = busqueda.toLowerCase()
    return sociosConTelegram.filter(
      (s) =>
        `${s.nombre} ${s.apellidos}`.toLowerCase().includes(q) ||
        (s.apodo && s.apodo.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q),
    )
  }, [sociosConTelegram, busqueda])

  const seleccionarTodos = () => {
    setModoTodos(true)
    setSelectedIds(new Set())
    setActiveRoles(new Set())
  }

  const seleccionarPorRol = (rol: Rol) => {
    setModoTodos(false)
    const newActive = new Set(activeRoles)
    const nuevosIds = new Set(selectedIds)

    if (newActive.has(rol)) {
      newActive.delete(rol)
      sociosConTelegram.forEach((s) => {
        if (s.roles.includes(rol)) {
          const tieneOtroRolActivo = s.roles.some((r) => r !== rol && newActive.has(r))
          if (!tieneOtroRolActivo) nuevosIds.delete(s.id)
        }
      })
    } else {
      newActive.add(rol)
      sociosConTelegram.forEach((s) => {
        if (s.roles.includes(rol)) nuevosIds.add(s.id)
      })
    }

    setActiveRoles(newActive)
    setSelectedIds(nuevosIds)
    if (nuevosIds.size === 0 && newActive.size === 0) setModoTodos(true)
  }

  const toggleSocio = (id: string) => {
    setModoTodos(false)
    const nuevo = new Set(selectedIds)
    if (nuevo.has(id)) nuevo.delete(id)
    else nuevo.add(id)
    setSelectedIds(nuevo)
    if (nuevo.size === 0) setModoTodos(true)
  }

  const quitarDestinatario = (id: string) => {
    const nuevo = new Set(selectedIds)
    nuevo.delete(id)
    setSelectedIds(nuevo)
    if (nuevo.size === 0) setModoTodos(true)
  }

  const destinatariosParaEnvio =
    modoTodos ? undefined : [...selectedIds]

  const selectedSocios = useMemo(
    () => sociosConTelegram.filter((s) => selectedIds.has(s.id)),
    [sociosConTelegram, selectedIds],
  )

  const conteoLabel = modoTodos
    ? `Todos los socios con Telegram (${sociosConTelegram.length})`
    : selectedIds.size === 0
    ? 'Ningún destinatario seleccionado'
    : `${selectedIds.size} destinatario${selectedIds.size !== 1 ? 's' : ''} seleccionado${selectedIds.size !== 1 ? 's' : ''}`

  const puedeEnviar = modoTodos || selectedIds.size > 0

  const { mutate: enviarAnuncio, isPending: enviandoAnuncio } = useMutation({
    mutationFn: () =>
      api.post<{ data: AnuncioResult }>('/telegram/anuncio', {
        mensaje,
        ...(destinatariosParaEnvio ? { destinatarios: destinatariosParaEnvio } : {}),
      }),
    onSuccess: ({ data }) => {
      toast.success(`Anuncio enviado: ${data.enviados} socios recibieron el mensaje`)
      if (data.errores > 0) toast.error(`${data.errores} envíos fallaron`)
      setMensaje('')
      setConfirmAnuncio(false)
    },
    onError: (err: Error) => {
      toast.error(err.message)
      setConfirmAnuncio(false)
    },
  })

  const { mutate: enviarRecordatorio, isPending: enviandoRecordatorio } = useMutation({
    mutationFn: () =>
      api.post<{ data: AnuncioResult }>('/telegram/recordatorio-pago', {
        ...(destinatariosParaEnvio ? { destinatarios: destinatariosParaEnvio } : {}),
      }),
    onSuccess: ({ data }) => {
      toast.success(`Recordatorio enviado: ${data.enviados} socios notificados`)
      if (data.errores > 0) toast.error(`${data.errores} envíos fallaron`)
      setConfirmPago(false)
    },
    onError: (err: Error) => {
      toast.error(err.message)
      setConfirmPago(false)
    },
  })

  const descConfirm = modoTodos
    ? `Se enviará a todos los socios activos con Telegram vinculado (${sociosConTelegram.length}).`
    : `Se enviará a ${selectedIds.size} destinatario${selectedIds.size !== 1 ? 's' : ''} seleccionado${selectedIds.size !== 1 ? 's' : ''}.`

  return (
    <>
      <SEOHead
        title="Anuncios Telegram"
        description="Comunicaciones masivas a socios"
        path="/directiva/anuncios"
        noindex
      />

      <div className="space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">
            Anuncios por Telegram
          </h1>
          <p className="text-muted-foreground mt-1">
            Envía mensajes a socios con Telegram vinculado
          </p>
        </div>

        {/* ── Selector de destinatarios ── */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <Users className="h-4 w-4" />
              Destinatarios
            </CardTitle>
            <CardDescription>
              Elige a quién enviar los mensajes. Por defecto se envían a todos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros rápidos */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={modoTodos ? 'default' : 'outline'}
                className="font-display font-bold h-7 text-xs"
                onClick={seleccionarTodos}
              >
                Todos ({sociosConTelegram.length})
              </Button>
              {ROLES_FILTRO.map((rol) => {
                const count = sociosConTelegram.filter((s) => s.roles.includes(rol)).length
                if (count === 0) return null
                return (
                  <Button
                    key={rol}
                    size="sm"
                    variant={activeRoles.has(rol) ? 'default' : 'outline'}
                    className="font-display font-bold h-7 text-xs"
                    onClick={() => seleccionarPorRol(rol)}
                  >
                    {ROL_LABELS[rol]} ({count})
                  </Button>
                )
              })}
            </div>

            {/* Búsqueda y lista — solo en modo selección */}
            {!modoTodos && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, apodo o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="border rounded-md max-h-52 overflow-y-auto divide-y">
                  {sociosFiltrados.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      No se encontraron socios
                    </p>
                  ) : (
                    sociosFiltrados.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedIds.has(s.id)}
                          onCheckedChange={() => toggleSocio(s.id)}
                        />
                        <span className="text-sm flex-1 min-w-0">
                          <span className="font-medium">
                            {s.nombre} {s.apellidos}
                          </span>
                          {s.apodo && (
                            <span className="text-muted-foreground ml-1">({s.apodo})</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground hidden sm:block shrink-0">
                          {ROL_LABELS[s.roles[0]] ?? s.roles[0]}
                        </span>
                      </label>
                    ))
                  )}
                </div>

                {/* Chips de seleccionados */}
                {selectedSocios.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSocios.map((s) => (
                      <Badge key={s.id} variant="secondary" className="gap-1 pr-1 font-display">
                        {s.nombre} {s.apellidos}
                        <button
                          onClick={() => quitarDestinatario(s.id)}
                          className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                          aria-label={`Quitar a ${s.nombre}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}

            <p className="text-sm text-muted-foreground">{conteoLabel}</p>
          </CardContent>
        </Card>

        {/* ── Mensaje personalizado ── */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Mensaje personalizado
            </CardTitle>
            <CardDescription>
              Puedes usar HTML básico: &lt;b&gt;negrita&lt;/b&gt;, &lt;i&gt;cursiva&lt;/i&gt;,{' '}
              &lt;code&gt;código&lt;/code&gt;.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Escribe aquí el mensaje para los socios..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <Button
              className="font-display font-bold gap-2"
              disabled={!mensaje.trim() || enviandoAnuncio || !puedeEnviar}
              onClick={() => setConfirmAnuncio(true)}
            >
              <Send className="h-4 w-4" />
              Enviar anuncio
            </Button>
          </CardContent>
        </Card>

        {/* ── Recordatorio de cuota ── */}
        {isDirectiva() && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base text-primary flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Recordatorio de cuota
              </CardTitle>
              <CardDescription>
                El mensaje incluye el importe de la cuota y el IBAN de la asociación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="font-display font-bold gap-2"
                disabled={enviandoRecordatorio || !puedeEnviar}
                onClick={() => setConfirmPago(true)}
              >
                {enviandoRecordatorio ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" /> Enviar recordatorio de pago
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Confirmar anuncio ── */}
      <AlertDialog open={confirmAnuncio} onOpenChange={setConfirmAnuncio}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Enviar este anuncio?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {descConfirm} Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => enviarAnuncio()}
              disabled={enviandoAnuncio}
              className="font-display font-bold"
            >
              {enviandoAnuncio ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirmar recordatorio ── */}
      <AlertDialog open={confirmPago} onOpenChange={setConfirmPago}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Enviar recordatorio de cuota?
            </AlertDialogTitle>
            <AlertDialogDescription>{descConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => enviarRecordatorio()}
              disabled={enviandoRecordatorio}
              className="font-display font-bold"
            >
              {enviandoRecordatorio ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
