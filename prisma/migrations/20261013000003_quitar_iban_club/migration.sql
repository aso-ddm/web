-- El recordatorio de pago por Telegram se elimina: el IBAN del club solo lo usaba él
DELETE FROM "Configuracion" WHERE clave = 'iban_club';
