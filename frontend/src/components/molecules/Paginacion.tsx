import { Button } from '@/components/ui/button'

/** Anterior / "página de total" / Siguiente. No se pinta si todo cabe en una página. */
export function Paginacion({ page, totalPages, onChange }: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" className="font-display" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </Button>
      <span className="px-3 py-1.5 text-sm text-muted-foreground font-display">
        {page} / {totalPages}
      </span>
      <Button variant="outline" size="sm" className="font-display" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Siguiente
      </Button>
    </div>
  )
}
