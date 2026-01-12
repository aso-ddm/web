import { MeepleIcon } from '@/components/atoms/icons'
import { cn } from '@/lib/utils'
import { SPACING } from '@/lib/constants'

interface FeatureItemProps {
  text: string
  className?: string
}

export function FeatureItem({ text, className }: FeatureItemProps) {
  return (
    <li className={cn(`flex ${SPACING.gapSm} items-center`, className)}>
      <MeepleIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent shrink-0 mt-0.5" />
      <span className="text-base sm:text-lg md:text-xl text-card tracking-wide">{text}</span>
    </li>
  )
}
