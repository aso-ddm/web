import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DragonIcon, DragonTextLogo } from '@/components/atoms/icons'
import { SEOHead } from '@/components/SEOHead'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/store/authStore'

const loginSchema = z.object({
  email: z.string().email('Introduce un email válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})
type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, getRedirectPath } = useAuthStore()

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: Location })?.from?.pathname
      navigate(from ?? getRedirectPath(), { replace: true })
    }
  }, [isAuthenticated, navigate, location, getRedirectPath])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      login(data.usuario, data.token)
      const from = (location.state as { from?: Location })?.from?.pathname
      navigate(from ?? getRedirectPath(), { replace: true })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return (
    <>
      <SEOHead title="Acceder" description="Accede al área privada de Dragón de Madera" path="/login" noindex />

      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-8 group">
          <DragonIcon className="h-14 w-14 fill-primary transition-transform group-hover:scale-105" />
          <DragonTextLogo className="h-9 w-48 fill-primary" />
        </Link>

        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-2xl sm:text-3xl text-primary">
              Área de socios
            </CardTitle>
            <CardDescription className="text-base">
              Accede con tu email y contraseña
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-display font-bold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="font-display font-bold">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full font-display font-bold text-base"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accediendo...
                  </>
                ) : (
                  'Acceder'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                ¿Todavía no eres socio?{' '}
                <Link
                  to="/registro"
                  className="text-secondary font-display font-bold hover:underline"
                >
                  Solicita el alta
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                <Link to="/" className="hover:text-primary transition-colors">
                  ← Volver a la web
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-xs text-muted-foreground text-center max-w-xs">
          Si tienes problemas para acceder, contacta con la directiva en{' '}
          <a
            href="mailto:info@dragondemadera.com"
            className="text-primary hover:underline"
          >
            info@dragondemadera.com
          </a>
        </p>
      </div>
    </>
  )
}
