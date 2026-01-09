import { Button } from '@/components/ui/button'
import { SOCIAL_URLS } from '@/lib/constants'
import texts from '@/data/texts.json'

interface WhatsAppButtonProps {
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'secondary'
}

export function WhatsAppButton({ className, size = 'lg', variant = 'default' }: WhatsAppButtonProps) {
  const baseClasses =
    'text-lg sm:text-xl md:text-2xl rounded-full border-0 px-5 py-4 sm:px-6 sm:py-5 md:p-6 font-display w-full sm:w-auto'

  const variantClasses = variant === 'default' ? 'text-background bg-primary' : 'bg-background text-secondary'

  return (
    <Button size={size} asChild className={`${baseClasses} ${variantClasses} ${className || ''}`}>
      <a href={SOCIAL_URLS.whatsapp} target="_blank" rel="noopener noreferrer">
        {texts.common.whatsappGroup}
      </a>
    </Button>
  )
}
