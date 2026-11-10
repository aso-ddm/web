import { Link } from 'react-router-dom'
import { Header, Footer } from '@/components/organisms'
import { SPACING } from '@/lib/constants'
import { SEOHead } from '@/components/atoms/SEOHead'
import { Skeleton } from '@/components/ui/skeleton'
import { RichTextContent } from '@/components/molecules/RichTextContent'
import { useConfig } from '@/hooks/useConfigValor'

// El texto lo edita la directiva en Configuración (clave texto_rgpd)
export function RgpdPage() {
  const { data: texto, isPending, isError } = useConfig('texto_rgpd')

  return (
    <>
      <SEOHead
        title="Política de privacidad y protección de datos"
        description="Información sobre el tratamiento de datos personales de los socios de Dragón de Madera conforme al RGPD."
        path="/rgpd"
      />
      <Header />

      <main className={`${SPACING.container} ${SPACING.padYLg}`}>
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-primary">Política de privacidad</h1>

          {isPending ? (
            <Skeleton className="h-96 w-full" />
          ) : isError || !texto ? (
            <p className="text-sm">
              No se ha podido cargar la política de privacidad. Inténtalo más tarde o escríbenos a info@dragondemadera.com.
            </p>
          ) : (
            <RichTextContent html={texto} className="prose-headings:font-display prose-headings:text-primary" />
          )}

          <div className="pt-4 border-t border-border text-sm">
            <Link to="/" className="text-primary underline">← Volver al inicio</Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
