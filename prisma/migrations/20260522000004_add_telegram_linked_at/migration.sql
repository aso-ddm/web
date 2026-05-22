-- AlterTable: add missing telegram columns (IF NOT EXISTS to be safe)
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "telegram_linked_at" TIMESTAMP(3);
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "telegram_chat_id" BIGINT;

-- CreateIndex (IF NOT EXISTS to be safe)
CREATE UNIQUE INDEX IF NOT EXISTS "Usuario_telegram_chat_id_key" ON "Usuario"("telegram_chat_id");
