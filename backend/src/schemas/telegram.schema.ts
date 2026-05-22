import { z } from 'zod'

export const telegramAuthSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number().int().positive(),
  hash: z.string().length(64),
})

export type TelegramAuthInput = z.infer<typeof telegramAuthSchema>
