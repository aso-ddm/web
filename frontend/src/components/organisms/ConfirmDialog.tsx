import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel: ReactNode
  onConfirm: () => void
  pending?: boolean
  destructive?: boolean
  /** Clases extra del botón de confirmar (p. ej. un color propio) */
  confirmClassName?: string
}

/** No se cierra al confirmar: queda abierto con el spinner hasta que el llamador lo cierra en onSuccess.
 *  Así no se puede confirmar dos veces y, si falla, se puede reintentar sin volver a abrirlo. */
export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel, onConfirm, pending, destructive, confirmClassName = '',
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !pending && onOpenChange(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-primary">{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-display" disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); onConfirm() }}
            disabled={pending}
            className={`font-display font-bold ${destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''} ${confirmClassName}`}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
