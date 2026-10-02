import DOMPurify from 'dompurify'
import { cn } from '@/lib/utils'

interface RichTextContentProps {
  html: string
  className?: string
}

function isHtml(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str)
}

// Convierte texto plano con marcadores **SECCIÓN** al HTML que espera prose.
// Solo se usa para contenido guardado antes del editor WYSIWYG.
function plainTextToHtml(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      // **SOLO ESTO** → <h3>
      if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
        return `<h3>${trimmed.replace(/\*\*/g, '').trim()}</h3>`
      }
      // **negrita** inline
      const withBold = trimmed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // --cursiva-- inline
      const withItalic = withBold.replace(/--([^-]+)--/g, '<em>$1</em>')
      return `<p>${withItalic}</p>`
    })
    .filter(Boolean)
    .join('\n')
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const source = isHtml(html) ? html : plainTextToHtml(html)
  const clean = DOMPurify.sanitize(source, { USE_PROFILES: { html: true } })
  return (
    <div
      className={cn('prose prose-sm prose-neutral dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
