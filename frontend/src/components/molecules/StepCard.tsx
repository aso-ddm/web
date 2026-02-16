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
        'rounded-xl p-6 sm:p-8 relative text-center shadow-md overflow-visible',
        isPrimary ? 'bg-accent' : 'bg-secondary text-primary-foreground',
        className
      )}
    >
      <div className="absolute -top-5 -left-5 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl sm:text-3xl font-display font-bold shadow-lg">
        {number}
      </div>
      <h3
        className={cn(
          'text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4 sm:mb-6 mt-4',
          isPrimary && 'text-primary'
        )}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}
