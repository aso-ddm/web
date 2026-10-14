-- CreateTable
CREATE TABLE "TelegramLog" (
    "id" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "metodo" TEXT NOT NULL,
    "contexto" TEXT NOT NULL,
    "chat_id" TEXT,
    "error" TEXT NOT NULL,
    "payload" JSONB,
    "reintentado_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelegramLog_created_at_idx" ON "TelegramLog"("created_at");
