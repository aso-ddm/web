import { Instagram, Twitter, Facebook } from 'lucide-react'
import { WhatsAppIcon } from '@/components/atoms/icons'
import { SOCIAL_URLS } from '@/lib/constants'
import { cn } from '@/lib/utils'

type Platform = 'instagram' | 'twitter' | 'facebook' | 'whatsapp'

interface SocialLinkProps {
  platform: Platform
  className?: string
  iconClassName?: string
}

const platformConfig = {
  instagram: { Icon: Instagram, url: SOCIAL_URLS.instagram, label: 'Instagram' },
  twitter: { Icon: Twitter, url: SOCIAL_URLS.twitter, label: 'Twitter' },
  facebook: { Icon: Facebook, url: SOCIAL_URLS.facebook, label: 'Facebook' },
  whatsapp: { Icon: WhatsAppIcon, url: SOCIAL_URLS.whatsapp, label: 'WhatsApp' },
} as const

export function SocialLink({ platform, className, iconClassName }: SocialLinkProps) {
  const { Icon, url, label } = platformConfig[platform]

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('text-muted-foreground hover:text-primary transition-colors', className)}
      aria-label={label}
    >
      <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6 text-background', iconClassName)} />
    </a>
  )
}
