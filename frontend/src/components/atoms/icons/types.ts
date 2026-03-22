export interface IconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
} as const
