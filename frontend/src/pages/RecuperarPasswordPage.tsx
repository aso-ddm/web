import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MessageCircle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SEOHead } from '@/components/SEOHead'
import { Header } from '@/components/organisms'
import { authApi } from '@/services/api/auth'

export function RecuperarPasswordPage() {
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const { mutate: requestReset, isPending: requestando } = useMutation({
    mutationFn: () => authApi.requestPasswordReset(email.trim().toLowerCase()),
    onSuccess: (data) => {
      if (data?.data?.hasTelegram) {
        toast.success('Código enviado por Telegram')
        setStep('code')
      } else {
        toast.error(
          'No tenemos un Telegram vinculado para ese email. Contacta con la directiva.',
          { duration: 6000 },
        )
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: confirmReset, isPending: confirmando } = useMutation({
    mutationFn: () => {
      if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')
      if (password !== passwordConfirm) throw new Error('Las contraseñas no coinciden')
      return authApi.confirmPasswordReset(email, token.trim(), password)
    },
    onSuccess: () => setStep('done'),
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <>
      <SEOHead
        title="Recuperar contraseña — Dragón de Madera"
        description="Recupera tu contraseña mediante Telegram"
        path="/recuperar-password"
        noindex
      />
      <Header />

      <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <MessageCircle className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl text-primary">
              Recuperar contraseña
            </CardTitle>
            <CardDescription>
              {step === 'email' && 'Introduce tu email y te enviaremos un código por Telegram'}
              {step === 'code' && 'Introduce el código que has recibido en Telegram'}
              {step === 'done' && 'Contraseña actualizada correctamente'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {step === 'email' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="font-display">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && email && requestReset()}
                  />
                </div>
                <Button
                  className="w-full font-display font-bold"
                  disabled={!email || requestando}
                  onClick={() => requestReset()}
                >
                  {requestando ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</>
                  ) : (
                    <><MessageCircle className="h-4 w-4 mr-2" /> Enviar código por Telegram</>
                  )}
                </Button>
              </>
            )}

            {step === 'code' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="token" className="font-display">Código de Telegram</Label>
                  <Input
                    id="token"
                    placeholder="123456"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    maxLength={6}
                    className="text-center text-xl tracking-widest font-display"
                  />
                  <p className="text-xs text-muted-foreground">
                    El código es válido 15 minutos.{' '}
                    <button
                      type="button"
                      onClick={() => requestReset()}
                      className="text-primary underline"
                    >
                      Reenviar
                    </button>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="font-display">Nueva contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirm" className="font-display">Confirmar contraseña</Label>
                  <Input
                    id="passwordConfirm"
                    type="password"
                    placeholder="Repite la contraseña"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full font-display font-bold"
                  disabled={!token || !password || !passwordConfirm || confirmando}
                  onClick={() => confirmReset()}
                >
                  {confirmando ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Actualizando...</>
                  ) : (
                    'Cambiar contraseña'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full font-display"
                  onClick={() => setStep('email')}
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Volver
                </Button>
              </>
            )}

            {step === 'done' && (
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <p className="text-muted-foreground text-sm">
                  Tu contraseña se ha actualizado. Ya puedes iniciar sesión con la nueva contraseña.
                </p>
                <Button asChild className="w-full font-display font-bold">
                  <Link to="/login">Ir al login</Link>
                </Button>
              </div>
            )}

            {step !== 'done' && (
              <div className="text-center pt-2">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5 inline mr-1" />
                  Volver al login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
