import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, Loader2, MessageCircle, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SEOHead } from '@/components/SEOHead'
import { api } from '@/services/api/client'
import { useAuthStore } from '@/store/authStore'

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

  const { mutate: enviarAnuncio, isPending: enviandoAnuncio } = useMutation({
    mutationFn: () => api.post<{ data: AnuncioResult }>('/telegram/anuncio', { mensaje }),
    onSuccess: ({ data }) => {
      toast.success(`Anuncio enviado: ${data.enviados} socios recibieron el mensaje`)
      if (data.errores > 0) toast.error(`${data.errores} envíos fallaron`)
      setMensaje('')
      setConfirmAnuncio(false)
    },
    onError: (err: Error) => { toast.error(err.message); setConfirmAnuncio(false) },
  })

  const { mutate: enviarRecordatorio, isPending: enviandoRecordatorio } = useMutation({
    mutationFn: () => api.post<{ data: AnuncioResult }>('/telegram/recordatorio-pago', {}),
    onSuccess: ({ data }) => {
      toast.success(`Recordatorio enviado: ${data.enviados} socios notificados`)
      if (data.errores > 0) toast.error(`${data.errores} envíos fallaron`)
      setConfirmPago(false)
    },
    onError: (err: Error) => { toast.error(err.message); setConfirmPago(false) },
  })

  return (
    <>
      <SEOHead title="Anuncios Telegram" description="Comunicaciones masivas a socios" path="/directiva/anuncios" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Anuncios por Telegram</h1>
          <p className="text-muted-foreground mt-1">
            Envía mensajes directos a todos los socios con avisos de Telegram confirmados
          </p>
        </div>

        {/* Enviar anuncio personalizado */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Mensaje personalizado
            </CardTitle>
            <CardDescription>
              El mensaje se enviará individualmente a cada socio activo con Telegram vinculado y avisos confirmados.
              Puedes usar etiquetas HTML básicas: &lt;b&gt;negrita&lt;/b&gt;, &lt;i&gt;cursiva&lt;/i&gt;, &lt;code&gt;código&lt;/code&gt;.
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
              disabled={!mensaje.trim() || enviandoAnuncio}
              onClick={() => setConfirmAnuncio(true)}
            >
              <Send className="h-4 w-4" />
              Enviar anuncio
            </Button>
          </CardContent>
        </Card>

        {/* Recordatorio de pago — solo directiva */}
        {isDirectiva() && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base text-primary flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Recordatorio de cuota
              </CardTitle>
              <CardDescription>
                Envía un recordatorio de pago mensual a todos los socios activos con Telegram configurado.
                El mensaje incluye el importe de su cuota y el IBAN de la asociación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="font-display font-bold gap-2"
                disabled={enviandoRecordatorio}
                onClick={() => setConfirmPago(true)}
              >
                {enviandoRecordatorio
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                  : <><Wallet className="h-4 w-4" /> Enviar recordatorio de pago</>
                }
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={confirmAnuncio} onOpenChange={setConfirmAnuncio}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Enviar este anuncio?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El mensaje se enviará a todos los socios activos con Telegram vinculado y avisos confirmados.
              Esta acción no se puede deshacer.
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

      <AlertDialog open={confirmPago} onOpenChange={setConfirmPago}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Enviar recordatorio de cuota?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se enviará un recordatorio de pago a todos los socios activos con Telegram vinculado.
            </AlertDialogDescription>
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
