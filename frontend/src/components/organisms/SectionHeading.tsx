import { SPACING } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  children: string
  className?: string
  centered?: boolean
}

export function SectionHeading({ children, className, centered = true }: SectionHeadingProps) {
  return (
    <div className={cn(SPACING.headingMargin, centered && 'text-center')}>
      <h2
        className={cn(
          `text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-balance font-display px-4 mb-3`,
          className
        )}
      >
        {children}
      </h2>
      {/* Accent line */}
      <div
        className={cn(
          'h-[3px] w-14 rounded-full bg-current opacity-25',
          centered && 'mx-auto'
        )}
      />
    </div>
  )
}
