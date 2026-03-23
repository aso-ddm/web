import type { ReactNode } from 'react'
import { SPACING } from '@/lib/constants'

interface PageHeroProps {
  title: string
  children?: ReactNode
}

/* Hexagonal tile pattern — guiño a los juegos de mesa */
const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-2.31L54 49V17.31L28 2.31 2 17.31V49L28 63.69z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`

export function PageHero({ title, children }: PageHeroProps) {
  return (
    <section className={`${SPACING.section} bg-secondary text-background relative overflow-hidden`}>
      {/* Hexagonal grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: HEX_PATTERN, backgroundSize: '56px 100px' }}
      />
      {/* Warm depth gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/25 pointer-events-none" />
      <div className={`${SPACING.container} text-center relative z-10`}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-balance leading-tight font-display anim-fade-in-up">
          {title}
        </h1>
        {children}
      </div>
    </section>
  )
}
