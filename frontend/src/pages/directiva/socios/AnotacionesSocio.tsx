import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, NotebookPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { sociosApi } from '@/services/api/socios'
import { invalidarSocios } from '@/lib/queryKeys'

/** Notas internas de la directiva sobre el socio (el socio y los vocales no las ven). */
export function AnotacionesSocio({ socioId, anotaciones }: { socioId: string; anotaciones: string | null }) {
  const queryClient = useQueryClient()
  const [texto, setTexto] = useState(anotaciones ?? '')
  const { mutate: guardar, isPending } = useMutation({
    mutationFn: () => sociosApi.setAnotaciones(socioId, texto),
    onSuccess: () => { toast.success('Anotaciones guardadas'); invalidarSocios(queryClient) },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <NotebookPen className="h-4 w-4 text-primary" />
        <p className="font-display font-bold text-sm">Anotaciones de la directiva</p>
      </div>
      <Textarea
        aria-label="Anotaciones de la directiva"
        placeholder="Información relevante sobre el socio (solo la ve la directiva)"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={5000}
        rows={4}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => guardar()}
        disabled={isPending || texto.trim() === (anotaciones ?? '')}
        className="font-display gap-2"
      >
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Guardar anotaciones
      </Button>
    </div>
  )
}
