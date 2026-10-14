import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { Clock, Loader2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PageLoader } from '@/components/atoms/PageLoader'
import { DragonIcon, DragonTextLogo } from '@/components/atoms/icons'
import { SEOHead } from '@/components/atoms/SEOHead'
import { RichTextContent } from '@/components/molecules/RichTextContent'
import { useConfigValor } from '@/hooks/useConfigValor'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/api/auth'
import { dniSchema, fechaNacimientoSchema, errMsg } from './registro/schema'
import { FieldError, FormSection } from './registro/FormParts'
import { QK } from '@/lib/queryKeys'
import { useShallow } from 'zustand/react/shallow'

const solicitudSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(2, 'Los apellidos son obligatorios'),
  dni: dniSchema,
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  fecha_nacimiento: fechaNacimientoSchema,
  direccion: z.string().optional(),
  apodo: z.string().trim().min(1, 'El apodo es obligatorio'),
  consentimiento_tiendas: z.boolean(),
})

type SolicitudForm = z.infer<typeof solicitudSchema>

const CAMPOS: { name: keyof SolicitudForm; label: string; type?: string }[] = [
  { name: 'nombre', label: 'Nombre' },
  { name: 'apellidos', label: 'Apellidos' },
  { name: 'dni', label: 'DNI / NIE' },
  { name: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date' },
  { name: 'telefono', label: 'Teléfono', type: 'tel' },
  { name: 'apodo', label: 'Apodo' },
]

/** Única página para una solicitud de alta pendiente: corregir sus datos hasta que la directiva la apruebe */
export function MiSolicitudPage() {
  const { isAuthenticated, usuario, logout, getRedirectPath } = useAuthStore(useShallow((s) => ({ isAuthenticated: s.isAuthenticated, usuario: s.usuario, logout: s.logout, getRedirectPath: s.getRedirectPath })))
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [comprobante, setComprobante] = useState<File>()
  const pendiente = usuario?.estado === 'pendiente'
  const textoConsentimiento = useConfigValor('texto_consentimiento_tiendas', 'Acepto que se compartan mis datos con las tiendas colaboradoras para obtener descuentos.')

  const { data } = useQuery({
    queryKey: QK.MI_SOLICITUD,
    queryFn: authApi.getSolicitud,
    enabled: isAuthenticated && pendiente,
  })
  const solicitud = data?.data

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<SolicitudForm>({
    resolver: zodResolver(solicitudSchema),
  })

  useEffect(() => {
    if (solicitud) reset({
      ...solicitud,
      telefono: solicitud.telefono ?? '',
      direccion: solicitud.direccion ?? '',
      fecha_nacimiento: solicitud.fecha_nacimiento?.slice(0, 10) ?? '',
    })
  }, [solicitud, reset])

  const { mutate: guardar, isPending } = useMutation({
    mutationFn: (form: SolicitudForm) => authApi.updateSolicitud(form, comprobante),
    onSuccess: (res) => {
      queryClient.setQueryData(['mi-solicitud'], res)
      setComprobante(undefined)
      toast.success('Solicitud actualizada')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!pendiente) return <Navigate to={getRedirectPath()} replace />
  if (!solicitud) return <PageLoader />

  const salir = () => { logout(); navigate('/') }

  return (
    <>
      <SEOHead title="Mi solicitud" description="Tu solicitud de alta en Dragón de Madera" path="/mi-solicitud" noindex />
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center text-center">
            <Link to="/" className="flex items-center gap-3 mb-5">
              <DragonIcon className="h-11 w-11 fill-primary" />
              <DragonTextLogo className="h-7 w-36 fill-primary" />
            </Link>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Mi solicitud de alta</h1>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-sm leading-relaxed flex items-start gap-1.5">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Pendiente de aprobación. Cuando la directiva la acepte podrás vincular tu Telegram y entrar al área de socios.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit((form) => guardar(form))} className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <FormSection number={1} title="Datos personales" description={`Cuenta: ${solicitud.email} · Cuota ${solicitud.tipo_cuota}`}>
            <div className="grid sm:grid-cols-2 gap-4">
              {CAMPOS.map(({ name, label, type }) => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={name} className="font-display font-bold text-sm">{label} <span className="text-destructive">*</span></Label>
                  <Input id={name} type={type} {...register(name)} />
                  <FieldError message={errMsg(errors[name])} />
                </div>
              ))}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="direccion" className="font-display font-bold text-sm">Dirección</Label>
                <Input id="direccion" {...register('direccion')} />
              </div>
              <label htmlFor="consentimiento_tiendas" className="flex items-start gap-3 sm:col-span-2 text-sm cursor-pointer">
                <Checkbox
                  id="consentimiento_tiendas"
                  checked={watch('consentimiento_tiendas')}
                  onCheckedChange={(v) => setValue('consentimiento_tiendas', Boolean(v))}
                  className="mt-0.5"
                />
                <RichTextContent html={textoConsentimiento} className="text-sm leading-relaxed" />
              </label>
            </div>
          </FormSection>

          <FormSection
            number={2}
            title="Comprobante de transferencia"
            description={`Ya está adjunto${solicitud.tipo_cuota === 'conjunta' ? ' (es el de toda la cuota conjunta)' : ''}. Sube otro solo si tienes que sustituirlo.`}
          >
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setComprobante(e.target.files?.[0])}
            />
          </FormSection>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
            <Button type="submit" disabled={isPending} className="flex-1 h-11 font-display font-bold gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}Guardar cambios
            </Button>
            <Button type="button" variant="outline" onClick={salir} className="h-11 font-display font-bold gap-2">
              <LogOut className="h-4 w-4" />Cerrar sesión
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
