-- Texto del aviso que ve el socio antes de pedir la baja desde Mi panel
INSERT INTO "Configuracion" (id, clave, valor, tipo, descripcion, "updated_at")
VALUES (
  gen_random_uuid(),
  'texto_baja_socio',
  '<p>Vamos a avisar al secretario del club de que quieres darte de baja. Se pondrá en contacto contigo por Telegram para cerrarla.</p><p><strong>Darte de baja implica:</strong></p><ul><li><p>Dejarás de pagar la cuota a partir del mes siguiente. Las cuotas ya pagadas no se devuelven.</p></li><li><p>Tendrás que devolver los juegos que tengas en préstamo y, si las tienes, las llaves del local.</p></li><li><p>Perderás el acceso al área de socios y a los grupos del club.</p></li><li><p>Si vuelves más adelante, tendrás que hacer una nueva alta y la antigüedad para pedir llaves empezará de cero.</p></li></ul>',
  'texto_largo',
  'Aviso que ve el socio en Mi panel antes de pedir la baja (qué implica darse de baja)',
  NOW()
)
ON CONFLICT (clave) DO NOTHING;
