-- Registro sin contraseña: el alta se vincula con Telegram y el login puede ser solo por Telegram
ALTER TABLE "Usuario" ALTER COLUMN "password_hash" DROP NOT NULL;
