import type { ReactNode } from 'react'
import { SPACING } from '@/lib/constants'

interface PageHeroProps {
  title: string
  children?: ReactNode
}

export function PageHero({ title, children }: PageHeroProps) {
  return (
    <section className={`${SPACING.section} bg-secondary text-background opacity-100`}>
      <div className={`${SPACING.container} text-center`}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-balance leading-tight font-display">
          {title}
        </h1>
        {children}
      </div>
    </section>
  )
}
