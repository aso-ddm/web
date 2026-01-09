import { SPACING } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  children: string
  className?: string
  centered?: boolean
}

export function SectionHeading({ children, className, centered = true }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        `text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold ${SPACING.headingMargin} text-balance font-display mb-6 sm:mb-8 px-4`,
        centered && 'text-center',
        className
      )}
    >
      {children}
    </h2>
  )
}
