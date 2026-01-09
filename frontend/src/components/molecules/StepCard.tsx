import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StepCardProps {
  number: number
  title: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}

export function StepCard({ number, title, children, variant = 'primary', className }: StepCardProps) {
  const isPrimary = variant === 'primary'

  return (
    <div
      className={cn(
        'rounded-lg p-6 sm:p-8 relative pt-16 sm:pt-12 text-center shadow-md',
        isPrimary ? 'bg-accent' : 'bg-secondary text-primary-foreground',
        className
      )}
    >
      <div className="absolute -top-6 -left-6 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl sm:text-3xl font-display font-bold">
        {number}
      </div>
      <h3
        className={cn(
          'text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4 sm:mb-6',
          isPrimary && 'text-primary'
        )}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}
