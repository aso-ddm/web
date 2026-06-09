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
import { DragonIcon, DragonTextLogo } from '@/components/atoms/icons'
import { SEOHead } from '@/components/SEOHead'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/store/authStore'

const loginSchema = z.object({
  email: z.string().email('Introduce un email válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})
type LoginForm = z.infer<typeof loginSchema>

/* Mismo patrón hexagonal que PageHero */
const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-2.31L54 49V17.31L28 2.31 2 17.31V49L28 63.69z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, getRedirectPath } = useAuthStore()

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

      <div className="min-h-screen flex">
        {/* ── Panel de marca (desktop) ─────────────────────────────── */}
        <div
          className="hidden lg:flex flex-col justify-between w-5/12 xl:w-2/5 bg-primary text-primary-foreground relative overflow-hidden p-12"
        >
          {/* Patrón hexagonal de fondo */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: HEX_PATTERN, backgroundSize: '56px 100px' }}
          />
          {/* Gradiente de profundidad */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 pointer-events-none" />

          {/* Logo arriba */}
          <Link to="/" className="relative z-10 flex items-center gap-3 group w-fit">
            <DragonIcon className="h-10 w-10 fill-primary-foreground transition-transform duration-300 group-hover:scale-105" />
            <DragonTextLogo className="h-7 fill-primary-foreground" />
          </Link>

          {/* Contenido central */}
          <div className="relative z-10 space-y-5">
            <p className="text-4xl xl:text-5xl font-display font-bold leading-tight text-primary-foreground">
              Tu club de<br />juegos de mesa<br />en Granada
            </p>
            <p className="text-primary-foreground/65 text-lg font-display leading-relaxed max-w-xs">
              Más de 800 juegos, partidas semanales y una comunidad que comparte tu afición.
            </p>
          </div>

          {/* Pie */}
          <p className="relative z-10 text-xs text-primary-foreground/40 font-display">
            © {new Date().getFullYear()} Dragón de Madera
          </p>
        </div>

        {/* ── Panel de formulario ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
          {/* Logo mobile */}
          <Link to="/" className="flex items-center gap-3 mb-10 group lg:hidden">
            <DragonIcon className="h-12 w-12 fill-primary transition-transform duration-300 group-hover:scale-105" />
            <DragonTextLogo className="h-8 fill-primary" />
          </Link>

          <div className="w-full max-w-sm space-y-8">
            {/* Cabecera */}
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">
                Bienvenido de nuevo
              </h1>
              <p className="text-muted-foreground mt-1.5">
                Accede con tu email y contraseña
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-display font-bold text-sm">
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
                <Label htmlFor="password" className="font-display font-bold text-sm">
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
                className="w-full font-display font-bold text-base h-11"
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

            {/* Links secundarios */}
            <div className="pt-2 border-t border-border text-center space-y-2.5">
              <p className="text-sm text-muted-foreground">
                ¿Todavía no eres socio?{' '}
                <Link
                  to="/registro"
                  className="text-secondary font-display font-bold hover:underline"
                >
                  Solicita el alta
                </Link>
              </p>
              <p className="text-sm">
                <Link
                  to="/recuperar-password"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
              <p className="text-sm">
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  ← Volver a la web
                </Link>
              </p>
            </div>
          </div>

          {/* Pie de ayuda */}
          <p className="mt-10 text-xs text-muted-foreground text-center max-w-xs">
            Si tienes problemas para acceder, contacta con la directiva por Telegram.
          </p>
        </div>
      </div>
    </>
  )
}
