import DOMPurify from 'dompurify'
import { cn } from '@/lib/utils'

interface RichTextContentProps {
  html: string
  className?: string
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
  return (
    <div
      className={cn('prose prose-sm prose-neutral dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
