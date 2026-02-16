import { Button } from '@/components/ui/button'
import { SOCIAL_URLS, SPACING } from '@/lib/constants'
import texts from '@/data/texts.json'

interface WhatsAppButtonProps {
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'secondary'
}

export function WhatsAppButton({ className, size = 'lg', variant = 'default' }: WhatsAppButtonProps) {
  const variantClasses = variant === 'default' ? 'text-background bg-primary' : 'bg-background text-secondary'

  return (
    <Button size={size} asChild className={`${SPACING.ctaButton} ${variantClasses} ${className || ''}`}>
      <a href={SOCIAL_URLS.whatsapp} target="_blank" rel="noopener noreferrer">
        {texts.common.whatsappGroup}
      </a>
    </Button>
  )
}
