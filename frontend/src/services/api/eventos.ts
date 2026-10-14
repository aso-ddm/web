import { useAuthStore } from '@/store/authStore'

/**
 * Escucha GET /api/eventos (SSE) y llama a onEvento con la queryKey que ha cambiado.
 * fetch y no EventSource: así el token va en la cabecera y no en la URL. Resuelve si el servidor corta.
 */
export async function escucharEventos(onEvento: (queryKey: string) => void, signal: AbortSignal) {
  const token = useAuthStore.getState().token
  const res = await fetch('/api/eventos', { headers: { Authorization: `Bearer ${token}` }, signal })
  if (!res.ok || !res.body) throw new Error(`Eventos: ${res.status}`)

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let pendiente = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) return
    const bloques = (pendiente + value).split('\n\n')
    pendiente = bloques.pop()!
    for (const b of bloques) if (b.startsWith('data: ')) onEvento(b.slice(6))
  }
}
