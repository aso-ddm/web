-- Enlaces de interés (grupos de Telegram, etc.) visibles en Mi panel. Valor: JSON [{ label, url }]
-- Los grupos de Telegram que estaban en "Documentos públicos" pasan a ser enlaces de interés.
INSERT INTO "Configuracion" (id, clave, valor, tipo, descripcion, "updated_at")
SELECT gen_random_uuid(), 'enlaces_interes',
  COALESCE((
    SELECT json_agg(json_build_object('label', t.label, 'url', c.valor) ORDER BY t.orden)::text
    FROM (VALUES ('url_telegram_principal', 'Grupo de Telegram', 1),
                 ('url_telegram_partidas', 'Grupo Telegram partidas', 2)) AS t(clave, label, orden)
    JOIN "Configuracion" c ON c.clave = t.clave AND c.valor ~* '^https?://'
  ), '[]'),
  'json', 'Enlaces de interés mostrados a los socios en Mi panel', NOW()
ON CONFLICT (clave) DO NOTHING;

DELETE FROM "Configuracion" WHERE clave IN ('url_telegram_principal', 'url_telegram_partidas');
