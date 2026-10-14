-- Mensaje de Telegram que recibe el socio cuando la directiva le da de baja ({nombre} = nombre del socio)
INSERT INTO "Configuracion" (id, clave, valor, tipo, descripcion, "updated_at")
VALUES (
  gen_random_uuid(),
  'texto_baja_confirmada',
  E'¡Hola, {nombre}! 👋\n\nTe confirmamos que se ha tramitado correctamente tu baja como socio/a de Dragón de Madera 🐉\n\nGracias por todo el tiempo que has compartido con nosotros. Si algún día quieres volver, las puertas del club siguen abiertas.',
  'texto_largo',
  'Mensaje de Telegram que recibe el socio al darle de baja ({nombre} = nombre del socio)',
  NOW()
)
ON CONFLICT (clave) DO NOTHING;
