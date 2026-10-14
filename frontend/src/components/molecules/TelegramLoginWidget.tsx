import { useEffect, useRef } from 'react'
import type { TelegramUser } from '@/services/api/auth'
import { useConfig } from '@/hooks/useConfigValor'

const BOT_POR_DEFECTO = 'Dragon_de_maderaBot'

// Callback global que invoca el script del widget de Telegram (data-onauth)
declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void
  }
}

interface TelegramLoginWidgetProps {
  onAuth: (user: TelegramUser) => void
  size?: 'small' | 'medium' | 'large'
  radius?: number
}

export function TelegramLoginWidget({
  onAuth,
  size = 'medium',
  radius,
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onAuthRef = useRef(onAuth)
  onAuthRef.current = onAuth

  // Bot de Configuración; vacío o sin configurar → el de por defecto (si no, Telegram dice "Bot username required").
  // Hasta saberlo no se monta: con otro bot la firma no cuadraría ("Firma de Telegram inválida")
  const { data: botConfig, isPending } = useConfig('telegram_bot_username')
  const botUsername = isPending ? null : botConfig?.trim() || BOT_POR_DEFECTO

  useEffect(() => {
    if (!botUsername) return
    window.onTelegramAuth = (user: TelegramUser) => onAuthRef.current(user)

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', size)
    if (radius !== undefined) script.setAttribute('data-radius', String(radius))
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.setAttribute('data-userpic', 'false') // sin foto: el botón queda centrado
    script.async = true

    containerRef.current?.appendChild(script)

    return () => {
      delete window.onTelegramAuth
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [botUsername, size, radius])

  return <div ref={containerRef} />
}
