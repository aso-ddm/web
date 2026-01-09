import { cn } from '@/lib/utils'

interface FaqButtonProps {
  text: string
  href: string
  className?: string
}

export function FaqButton({ text, href, className }: FaqButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-block mt-3 text-base sm:text-lg md:text-xl lg:text-2xl text-secondary underline hover:no-underline transition-all',
        className
      )}
    >
      {text}
    </a>
  )
}
