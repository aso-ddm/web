-- Añade los precios de cuota como configuración del sistema
INSERT INTO "Configuracion" (id, clave, valor, tipo, descripcion, "updatedAt")
VALUES
  (gen_random_uuid(), 'precio_cuota_individual', '15', 'numero', 'Precio mensual de la cuota individual (en euros)', NOW()),
  (gen_random_uuid(), 'precio_cuota_adicional',  '5',  'numero', 'Precio mensual por cada miembro adicional en una cuota conjunta (en euros)', NOW())
ON CONFLICT (clave) DO NOTHING;
