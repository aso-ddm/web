import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'
import { DragonIcon } from '@/components/atoms/icons'
import { TelegramLoginWidget } from '@/components/TelegramLoginWidget'
import { authApi, type TelegramUser } from '@/services/api/auth'
import { configuracionApi } from '@/services/api/configuracion'
import { useAuthStore } from '@/store/authStore'

export function TelegramLinkModal() {
  const { usuario } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
    enabled: !!usuario,
    staleTime: 5 * 60 * 1000,
  })

  const { data: botConfig } = useQuery({
    queryKey: ['config', 'telegram_bot_username'],
    queryFn: () => configuracionApi.getOne('telegram_bot_username'),
    enabled: !!usuario,
    staleTime: 5 * 60 * 1000,
  })

  const { mutate: linkTelegram } = useMutation({
    mutationFn: (user: TelegramUser) => authApi.linkTelegram(user),
    onSuccess: () => {
      toast.success('Telegram vinculado correctamente')
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const needsTelegramLink =
    meData?.data !== undefined &&
    !meData.data.telegram_chat_id &&
    !meData.data.roles.includes('administrador')

  const botUsername = botConfig?.data?.valor

  if (!needsTelegramLink) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 text-center space-y-6 p-8 rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-center gap-3">
          <DragonIcon className="h-12 w-12 fill-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display font-bold text-2xl text-primary">
            Vincula tu Telegram
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Para continuar usando el área de socios necesitas vincular tu cuenta de Telegram.
            Así podrás recibir comunicaciones del club y recuperar tu contraseña si la olvidas.
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3 text-left">
            <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <p className="text-sm text-foreground">
              Pulsa el botón de abajo e inicia sesión con tu cuenta de Telegram.
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <p className="text-sm text-foreground">
              Autoriza la vinculación cuando Telegram te lo solicite.
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">3</span>
            </div>
            <p className="text-sm text-foreground">
              ¡Listo! Ya podrás acceder a todas las funciones del club.
            </p>
          </div>
        </div>

        {botUsername ? (
          <div className="flex justify-center">
            <TelegramLoginWidget
              onAuth={linkTelegram}
              botUsername={botUsername}
              size="large"
              radius={8}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MessageCircle className="h-5 w-5" />
            <p className="text-sm">
              El bot de Telegram aún no está configurado. Contacta con la directiva.
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Si tienes problemas, escribe a la directiva por Telegram o en{' '}
          <span className="font-medium">info@dragondemadera.com</span>
        </p>
      </div>
    </div>
  )
}
