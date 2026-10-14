-- Telegram no se desvincula nunca salvo con la baja: las bajas anteriores a esta regla también quedan sin vincular
UPDATE "Usuario" SET "telegram_chat_id" = NULL, "telegram_linked_at" = NULL
WHERE "estado" = 'baja' AND "telegram_chat_id" IS NOT NULL;
