import texts from '@/data/texts.json'

export interface NavigationItem {
  label: string
  to: string
  scrollTo?: 'top' | string
}

export const navigationItems: NavigationItem[] = [
  { label: texts.navigation.home, to: '/', scrollTo: 'top' },
  { label: texts.navigation.calendar, to: '/', scrollTo: 'calendario' },
  { label: texts.navigation.club, to: '/club' },
  { label: texts.navigation.member, to: '/socio' },
]
