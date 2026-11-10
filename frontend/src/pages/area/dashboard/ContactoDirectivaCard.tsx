import { useQuery } from '@tanstack/react-query'
import { Mail, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { sociosApi } from '@/services/api/socios'
import { QK } from '@/lib/queryKeys'
import { getRolLabel } from '@/lib/roles'

/** Contacto de presidente, secretario, tesorero y vocales; no se pinta si no hay ninguno */
export function ContactoDirectivaCard() {
  const { data, isLoading } = useQuery({
    queryKey: QK.SOCIOS_DIRECTIVA,
    queryFn: () => sociosApi.getDirectiva(),
    staleTime: 10 * 60_000,
  })
  const junta = data?.data ?? []
  if (!isLoading && junta.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg text-primary">¿A quién pregunto si necesito algo?</CardTitle>
        <p className="text-sm text-muted-foreground">La junta directiva del club</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {junta.map((m) => {
              const telegram = m.alias_telegram?.replace(/^@/, '')
              return (
                <li key={m.id} className="rounded-lg border border-border p-3 min-w-0">
                  <p className="text-xs text-muted-foreground font-display">{getRolLabel(m.cargo)}</p>
                  <p className="text-sm font-display font-bold truncate">
                    {m.nombre} {m.apellidos}
                    {m.apodo && <span className="font-normal text-muted-foreground"> ({m.apodo})</span>}
                  </p>
                  <div className="mt-1.5 space-y-1 text-sm">
                    {telegram && (
                      <a
                        href={`https://t.me/${telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-secondary hover:underline"
                      >
                        <Send className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">@{telegram}</span>
                      </a>
                    )}
                    <a href={`mailto:${m.email}`} className="flex items-center gap-1.5 text-secondary hover:underline">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{m.email}</span>
                    </a>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
