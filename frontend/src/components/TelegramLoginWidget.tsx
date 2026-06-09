import { useEffect, useRef } from 'react'
import type { TelegramUser } from '@/services/api/auth'

interface TelegramLoginWidgetProps {
  onAuth: (user: TelegramUser) => void
  botUsername?: string
  size?: 'small' | 'medium' | 'large'
  radius?: number
}

export function TelegramLoginWidget({
  onAuth,
  botUsername = 'Dragon_de_maderaBot',
  size = 'medium',
  radius,
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onAuthRef = useRef(onAuth)
  onAuthRef.current = onAuth

  useEffect(() => {
    ;(window as any).onTelegramAuth = (user: TelegramUser) => onAuthRef.current(user)

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', size)
    if (radius !== undefined) script.setAttribute('data-radius', String(radius))
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true

    containerRef.current?.appendChild(script)

    return () => {
      delete (window as any).onTelegramAuth
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [botUsername, size, radius])

  return <div ref={containerRef} />
}
