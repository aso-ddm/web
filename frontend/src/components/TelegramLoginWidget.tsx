import { useEffect, useRef } from 'react'
import type { TelegramUser } from '@/services/api/auth'

interface TelegramLoginWidgetProps {
  onAuth: (user: TelegramUser) => void
}

export function TelegramLoginWidget({ onAuth }: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onAuthRef = useRef(onAuth)
  onAuthRef.current = onAuth

  useEffect(() => {
    ;(window as any).onTelegramAuth = (user: TelegramUser) => onAuthRef.current(user)

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', 'Dragon_de_maderaBot')
    script.setAttribute('data-size', 'medium')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true

    containerRef.current?.appendChild(script)

    return () => {
      delete (window as any).onTelegramAuth
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [])

  return <div ref={containerRef} />
}
