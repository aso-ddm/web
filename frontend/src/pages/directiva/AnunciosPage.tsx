import { useState, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, Loader2, MessageCircle, Search, X, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SEOHead } from '@/components/SEOHead'
import { api } from '@/services/api/client'
import { sociosApi } from '@/services/api/socios'

interface AnuncioResult {
  enviados: number
  errores: number
  total: number
}

export function AnunciosPage() {
  const [mensaje, setMensaje] = useState('')
  const [confirmAnuncio, setConfirmAnuncio] = useState(false)
  const [tab, setTab] = useState<'todos' | 'socios'>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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

  const todosSeleccionados =
    sociosFiltrados.length > 0 && sociosFiltrados.every((s) => selectedIds.has(s.id))

  const toggleSocio = (id: string) => {
    const nuevo = new Set(selectedIds)
    if (nuevo.has(id)) nuevo.delete(id)
    else nuevo.add(id)
    setSelectedIds(nuevo)
  }

  const toggleTodosVisibles = () => {
    const nuevo = new Set(selectedIds)
    if (todosSeleccionados) {
      sociosFiltrados.forEach((s) => nuevo.delete(s.id))
    } else {
      sociosFiltrados.forEach((s) => nuevo.add(s.id))
    }
    setSelectedIds(nuevo)
  }

  const quitarDestinatario = (id: string) => {
    const nuevo = new Set(selectedIds)
    nuevo.delete(id)
    setSelectedIds(nuevo)
  }

  const selectedSocios = useMemo(
    () => sociosConTelegram.filter((s) => selectedIds.has(s.id)),
    [sociosConTelegram, selectedIds],
  )

  const destinatariosParaEnvio = tab === 'todos' ? undefined : [...selectedIds]
  const puedeEnviar = tab === 'todos' || selectedIds.size > 0

  const descConfirm =
    tab === 'todos'
      ? `Se enviará a todos los socios activos con Telegram vinculado (${sociosConTelegram.length}).`
      : `Se enviará a ${selectedIds.size} destinatario${selectedIds.size !== 1 ? 's' : ''} seleccionado${selectedIds.size !== 1 ? 's' : ''}.`

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

        {/* ── Destinatarios ── */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <Users className="h-4 w-4" />
              Destinatarios
            </CardTitle>
            <CardDescription>
              Elige a quién enviar los mensajes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'todos' | 'socios')}>
              <TabsList className="mb-4">
                <TabsTrigger value="todos" className="font-display font-bold">
                  Todos ({sociosConTelegram.length})
                </TabsTrigger>
                <TabsTrigger value="socios" className="font-display font-bold">
                  Socios concretos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="todos">
                <p className="text-sm text-muted-foreground">
                  El mensaje se enviará a todos los socios activos con Telegram vinculado.
                </p>
              </TabsContent>

              <TabsContent value="socios" className="space-y-3">
                {/* Buscador */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, apodo o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Lista */}
                <div className="border rounded-md overflow-hidden">
                  {/* Fila seleccionar todos */}
                  {sociosFiltrados.length > 0 && (
                    <label className="flex items-center gap-3 px-3 py-2 bg-muted/30 border-b cursor-pointer hover:bg-muted/50">
                      <Checkbox
                        checked={todosSeleccionados}
                        onCheckedChange={toggleTodosVisibles}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {todosSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        {busqueda && ' los resultados'}
                      </span>
                    </label>
                  )}

                  <div className="max-h-52 overflow-y-auto divide-y">
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
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Chips seleccionados */}
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

                {selectedIds.size === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Ningún destinatario seleccionado.
                  </p>
                )}
              </TabsContent>
            </Tabs>
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
    </>
  )
}
