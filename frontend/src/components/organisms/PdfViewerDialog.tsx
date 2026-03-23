import { FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Convierte URLs de servicios externos al formato embebible en iframe.
 * - Google Drive /view o /open?id= → /preview (permite embedding)
 * - Resto de URLs: sin cambios
 */
function toEmbedUrl(url: string): string {
  // drive.google.com/file/d/{ID}/view  →  /preview
  const driveFile = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (driveFile) {
    return `https://drive.google.com/file/d/${driveFile[1]}/preview`
  }
  // drive.google.com/open?id={ID}  →  /preview
  const driveOpen = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (driveOpen) {
    return `https://drive.google.com/file/d/${driveOpen[1]}/preview`
  }
  return url
}

interface PdfViewerDialogProps {
  url: string
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PdfViewerDialog({ url, title, open, onOpenChange }: PdfViewerDialogProps) {
  const embedUrl = toEmbedUrl(url)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[88vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-3 border-b flex-row items-center justify-between shrink-0">
          <DialogTitle className="font-display flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {title}
          </DialogTitle>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-display font-bold shrink-0" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir en nueva pestaña
            </a>
          </Button>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-muted/30">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            title={title}
            allow="autoplay"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
