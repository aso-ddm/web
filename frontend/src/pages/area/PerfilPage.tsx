import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Key, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/SEOHead'
import { authApi } from '@/services/api/auth'
import { sociosApi } from '@/services/api/socios'
import { useAuthStore } from '@/store/authStore'
import { getRolLabel } from '@/lib/roles'

const perfilSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  apodo: z.string().optional(),
})
type PerfilForm = z.infer<typeof perfilSchema>

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function PerfilPage() {
  const { usuario: authUsuario, updateUsuario } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: meData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
  })
  const usuario = meData?.data

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PerfilForm>({ resolver: zodResolver(perfilSchema) })

  useEffect(() => {
    if (usuario) {
      reset({
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        telefono: usuario.telefono ?? '',
        direccion: usuario.direccion ?? '',
        apodo: usuario.apodo ?? '',
      })
    }
  }, [usuario, reset])

  const { mutate: guardar, isPending: guardando } = useMutation({
    mutationFn: (data: PerfilForm) => sociosApi.update(authUsuario!.id, data),
    onSuccess: ({ data }) => {
      updateUsuario(data)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Perfil actualizado correctamente')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: solicitarLlaves, isPending: solicitando } = useMutation({
    mutationFn: () => sociosApi.solicitarLlaves(authUsuario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Solicitud de llaves enviada correctamente')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Calcular si puede solicitar llaves (≥ 6 meses como socio, o rol de admin)
  const esAdmin = usuario?.roles.some((r) => ['presidente', 'secretario', 'tesorero'].includes(r))
  const puedesolicitarLlaves =
    usuario?.estado === 'activo' &&
    !usuario.tiene_llaves &&
    !usuario.fecha_solicitud_llaves &&
    (esAdmin || (
      !!usuario.fecha_alta &&
      new Date().getTime() - new Date(usuario.fecha_alta).getTime() >= 180 * 24 * 60 * 60 * 1000
    ))

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <>
      <SEOHead title="Mi perfil" description="Edita tus datos de socio" path="/area/perfil" noindex />

      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Mi perfil</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus datos personales y configuración de cuenta</p>
        </div>

        {/* Datos no editables */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary">Información de cuenta</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs font-display mb-0.5">Email</p>
              <p className="font-medium">{usuario?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-display mb-0.5">DNI</p>
              <p className="font-medium">{usuario?.dni}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-display mb-0.5">Estado</p>
              <Badge variant={usuario?.estado === 'activo' ? 'default' : 'secondary'} className="font-display capitalize">
                {usuario?.estado}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-display mb-0.5">Tipo de cuota</p>
              <p className="font-medium capitalize">{usuario?.tipo_cuota}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-display mb-0.5">Roles</p>
              <p className="font-medium">{usuario?.roles.map(getRolLabel).join(', ')}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-display mb-0.5">Socio desde</p>
              <p className="font-medium">{formatDate(usuario?.fecha_alta)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Formulario editable */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary">Datos personales</CardTitle>
            <CardDescription>Puedes actualizar estos datos en cualquier momento</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => guardar(data))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre" className="font-display font-bold text-xs">Nombre</Label>
                  <Input id="nombre" {...register('nombre')} className={errors.nombre ? 'border-destructive' : ''} />
                  {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="apellidos" className="font-display font-bold text-xs">Apellidos</Label>
                  <Input id="apellidos" {...register('apellidos')} className={errors.apellidos ? 'border-destructive' : ''} />
                  {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telefono" className="font-display font-bold text-xs">Teléfono</Label>
                  <Input id="telefono" {...register('telefono')} placeholder="612 345 678" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="apodo" className="font-display font-bold text-xs">Apodo en el club</Label>
                  <Input id="apodo" {...register('apodo')} placeholder="Tu mote" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="direccion" className="font-display font-bold text-xs">Dirección</Label>
                <Input id="direccion" {...register('direccion')} placeholder="Calle, número, ciudad..." />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={guardando || !isDirty}
                  className="font-display font-bold"
                >
                  {guardando ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                  ) : (
                    'Guardar cambios'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sección llaves */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <Key className="h-4 w-4" /> Llaves del club
            </CardTitle>
            <CardDescription>
              Puedes solicitar un juego de llaves cuando llevas al menos 6 meses como socio activo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usuario?.tiene_llaves ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-display font-bold text-emerald-700 text-sm">Tienes llaves del club</p>
                  {usuario.fecha_aprobacion_llaves && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Aprobadas el {formatDate(usuario.fecha_aprobacion_llaves)}
                    </p>
                  )}
                </div>
              </div>
            ) : usuario?.fecha_solicitud_llaves ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-display font-bold text-amber-700 text-sm">Solicitud pendiente</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Solicitadas el {formatDate(usuario.fecha_solicitud_llaves)} — esperando aprobación de la directiva
                  </p>
                </div>
              </div>
            ) : puedesolicitarLlaves ? (
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-accent/40 border border-border">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-display font-bold text-sm">¡Ya puedes solicitar las llaves!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Llevas más de 6 meses como socio activo</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => solicitarLlaves()}
                  disabled={solicitando}
                  className="font-display font-bold flex-shrink-0"
                >
                  {solicitando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Solicitar'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-display font-bold text-sm text-muted-foreground">Aún no disponible</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Necesitas al menos 6 meses como socio activo
                    {usuario?.fecha_alta && ` (alta: ${formatDate(usuario.fecha_alta)})`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
