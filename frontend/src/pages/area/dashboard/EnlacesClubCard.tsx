import { ExternalLink, FileText, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useConfigValor, useEnlacesInteres } from '@/hooks/useConfigValor'

/** Enlaces de interés (grupos, redes…) y documentos del club en una sola tarjeta; no se pinta si no hay ninguno */
export function EnlacesClubCard() {
  const enlacesInteres = useEnlacesInteres().data ?? []
  const documentos = [
    { label: 'Estatutos', url: useConfigValor('url_estatutos', '') },
    { label: 'Reglamento interno', url: useConfigValor('url_reglamento_interno', '') },
  ].filter((d) => d.url)

  if (enlacesInteres.length === 0 && documentos.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg text-primary">Enlaces del club</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {enlacesInteres.map((e, i) => (
          <Enlace key={`e${i}`} url={e.url} label={e.label} icon={<MessageCircle className="h-4 w-4" />} />
        ))}
        {documentos.map((d) => (
          <Enlace key={d.label} url={d.url} label={d.label} icon={<FileText className="h-4 w-4" />} />
        ))}
      </CardContent>
    </Card>
  )
}

function Enlace({ url, label, icon }: { url: string; label: string; icon: React.ReactNode }) {
  return (
    <Button asChild variant="outline" className="justify-start gap-3 font-display">
      <a href={url} target="_blank" rel="noopener noreferrer">
        {icon}
        <span className="truncate">{label}</span>
        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
      </a>
    </Button>
  )
}
