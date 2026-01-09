import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SPACING } from '@/lib/constants'

interface ContainerProps {
  children: ReactNode
  className?: string
  size?: 'narrow' | 'default' | 'wide' | 'form'
}

const sizeClasses = {
  narrow: SPACING.maxWidthNarrow,
  default: SPACING.maxWidthContent,
  wide: SPACING.maxWidthWide,
  form: SPACING.maxWidthForm,
} as const

export function Container({ children, className, size }: ContainerProps) {
  return (
    <div className={cn(SPACING.container, size && sizeClasses[size], className)}>
      {children}
    </div>
  )
}
