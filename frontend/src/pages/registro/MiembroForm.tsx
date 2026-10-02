import { useForm } from 'react-hook-form'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichTextContent } from '@/components/molecules/RichTextContent'
import type { RegistroForm } from './schema'
import { FieldError } from './FormParts'

// ── Formulario de miembro adicional ──────────────────────────────────────────

type AnyErrors = Record<string, unknown>

export function MiembroForm({
  index,
  register,
  errors,
  setValue,
  watch,
  onRemove,
  textoConsentimiento,
}: {
  index: number
  register: ReturnType<typeof useForm<RegistroForm>>['register']
  errors: AnyErrors
  setValue: ReturnType<typeof useForm<RegistroForm>>['setValue']
  watch: ReturnType<typeof useForm<RegistroForm>>['watch']
  onRemove: () => void
  textoConsentimiento?: string
}) {
  const miembrosErrors = (errors as { miembros_adicionales?: AnyErrors[] }).miembros_adicionales
  const err = miembrosErrors?.[index] as AnyErrors | undefined
  const tipoRelacion = (watch as (name: string) => string)(`miembros_adicionales.${index}.tipo_relacion`)
  const consentimiento = (watch as (name: string) => boolean)(`miembros_adicionales.${index}.consentimiento_tiendas`)

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-sm text-primary">Miembro {index + 1}</p>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={onRemove} aria-label="Eliminar miembro">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="font-display font-bold text-sm">Tipo de relación <span className="text-destructive">*</span></Label>
        <Select value={tipoRelacion} onValueChange={(v: string) => (setValue as (name: string, value: string) => void)(`miembros_adicionales.${index}.tipo_relacion`, v)}>
          <SelectTrigger><SelectValue placeholder="Selecciona el tipo de relación" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pareja">Pareja</SelectItem>
            <SelectItem value="familiar_directo">Familiar directo</SelectItem>
          </SelectContent>
        </Select>
        <FieldError message={(err?.tipo_relacion as { message?: string } | undefined)?.message} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Nombre <span className="text-destructive">*</span></Label>
          <Input placeholder="Juan" {...register(`miembros_adicionales.${index}.nombre` as const)} />
          <FieldError message={(err?.nombre as { message?: string } | undefined)?.message} />
        </div>
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Apellidos <span className="text-destructive">*</span></Label>
          <Input placeholder="García López" {...register(`miembros_adicionales.${index}.apellidos` as const)} />
          <FieldError message={(err?.apellidos as { message?: string } | undefined)?.message} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">DNI / NIE <span className="text-destructive">*</span></Label>
          <Input placeholder="12345678Z" maxLength={9} {...register(`miembros_adicionales.${index}.dni` as const)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { e.target.value = e.target.value.toUpperCase(); register(`miembros_adicionales.${index}.dni` as const).onChange(e) }} />
          <FieldError message={(err?.dni as { message?: string } | undefined)?.message} />
        </div>
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Email <span className="text-destructive">*</span></Label>
          <Input type="email" placeholder="email@ejemplo.com" {...register(`miembros_adicionales.${index}.email` as const)} />
          <FieldError message={(err?.email as { message?: string } | undefined)?.message} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Teléfono <span className="text-destructive">*</span></Label>
          <Input type="tel" placeholder="600 000 000" {...register(`miembros_adicionales.${index}.telefono` as const)} />
          <FieldError message={(err?.telefono as { message?: string } | undefined)?.message} />
        </div>
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Fecha de nacimiento <span className="text-destructive">*</span></Label>
          <Input type="date" {...register(`miembros_adicionales.${index}.fecha_nacimiento` as const)} />
          <FieldError message={(err?.fecha_nacimiento as { message?: string } | undefined)?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-display font-bold text-sm">Alias de Telegram <span className="text-destructive">*</span></Label>
        <Input placeholder="tuusuario" {...register(`miembros_adicionales.${index}.alias_telegram` as const)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { e.target.value = e.target.value.replace(/^@+/, ''); register(`miembros_adicionales.${index}.alias_telegram` as const).onChange(e) }} />
        <FieldError message={(err?.alias_telegram as { message?: string } | undefined)?.message} />
      </div>

      <div className="space-y-1.5">
        <Label className="font-display font-bold text-sm">Apodo <span className="text-muted-foreground font-normal text-xs">(cómo te conoce la gente)</span></Label>
        <Input placeholder="Ej: Carly, El Mago..." {...register(`miembros_adicionales.${index}.apodo` as const)} />
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
        <Checkbox
          checked={consentimiento}
          onCheckedChange={(v) => (setValue as (name: string, value: boolean) => void)(`miembros_adicionales.${index}.consentimiento_tiendas`, Boolean(v))}
          className="mt-0.5 flex-shrink-0"
        />
        {/* El texto se edita con el editor enriquecido: es HTML */}
        <RichTextContent html={textoConsentimiento ?? 'Acepto que se compartan mis datos con las tiendas colaboradoras para obtener descuentos.'} className="text-sm leading-relaxed" />
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Contraseña <span className="text-destructive">*</span></Label>
          <Input type="password" autoComplete="new-password" placeholder="Mín. 8 caracteres" {...register(`miembros_adicionales.${index}.password` as const)} />
          <FieldError message={(err?.password as { message?: string } | undefined)?.message} />
        </div>
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Confirmar contraseña <span className="text-destructive">*</span></Label>
          <Input type="password" autoComplete="new-password" placeholder="Repite la contraseña" {...register(`miembros_adicionales.${index}.confirmPassword` as const)} />
          <FieldError message={(err?.confirmPassword as { message?: string } | undefined)?.message} />
        </div>
      </div>
    </div>
  )
}
