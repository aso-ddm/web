import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PdfViewerDialog } from '@/components/organisms/PdfViewerDialog'

// ── Helpers ───────────────────────────────────────────────────────────────────


export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ── Sub-components ────────────────────────────────────────────────────────────

export function FormSection({
  number,
  title,
  description,
  children,
  className = '',
}: {
  number: number
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`border-border shadow-none overflow-hidden ${className}`}>
      <CardHeader className="px-6 pt-6 pb-4 flex-row items-start gap-3 space-y-0">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground font-display font-bold text-xs flex items-center justify-center mt-0.5 select-none">
          {number}
        </div>
        <div>
          <CardTitle className="font-display font-bold text-base text-primary leading-tight">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs mt-0.5 leading-relaxed">{description}</CardDescription>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="px-6 pt-5 pb-6">{children}</CardContent>
    </Card>
  )
}


export function DocumentosCard({ urlEstatutos, urlReglamento }: { urlEstatutos?: string; urlReglamento?: string }) {
  const [pdfOpen, setPdfOpen] = useState<{ url: string; title: string } | null>(null)
  const docs = [
    { key: 'estatutos', label: 'Estatutos', url: urlEstatutos },
    { key: 'reglamento', label: 'Reglamento interno', url: urlReglamento },
  ]

  return (
    <>
      <Card className="border-secondary/30 shadow-none">
        <CardHeader className="px-6 pt-5 pb-4 flex-row items-center gap-3 space-y-0">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center">
            <FileText className="h-3.5 w-3.5 text-secondary" />
          </div>
          <div>
            <CardTitle className="font-display font-bold text-base text-secondary leading-tight">Estatutos y Reglamento interno</CardTitle>
            <CardDescription className="text-xs mt-0.5">De obligada lectura antes de enviar la solicitud</CardDescription>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="px-6 pt-4 pb-5 space-y-3">
          <p className="text-sm leading-relaxed">Aquí tienes un resumen de la información relevante sobre el club, de obligada lectura.</p>
          <div className="flex flex-wrap gap-2">
            {docs.map(({ key, label, url }) =>
              url ? (
                <Button key={key} variant="outline" size="sm" className="font-display font-bold gap-1.5 text-xs border-secondary/40 text-secondary hover:bg-secondary/5 hover:text-secondary hover:border-secondary" onClick={() => setPdfOpen({ url, title: label })}>
                  <FileText className="h-3.5 w-3.5" />Ver {label}
                </Button>
              ) : (
                <Button key={key} variant="ghost" size="sm" disabled className="font-display font-bold gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" />{label} — próximamente
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>
      {pdfOpen && <PdfViewerDialog url={pdfOpen.url} title={pdfOpen.title} open={!!pdfOpen} onOpenChange={(open) => { if (!open) setPdfOpen(null) }} />}
    </>
  )
}
