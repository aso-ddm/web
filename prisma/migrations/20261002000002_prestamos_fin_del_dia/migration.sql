-- Los préstamos vencen al acabar el día límite (23:59:59.999 hora de Madrid), no a la hora en que se prestaron.
-- fecha_limite es TIMESTAMP sin zona guardado en UTC.
UPDATE "Prestamo"
SET "fecha_limite" =
  ((("fecha_limite" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Madrid')::date + TIME '23:59:59.999')
  AT TIME ZONE 'Europe/Madrid' AT TIME ZONE 'UTC'
WHERE "estado" = 'activo';
