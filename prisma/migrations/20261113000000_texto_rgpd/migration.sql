-- Política de privacidad (/rgpd) editable por la directiva desde Configuración
INSERT INTO "Configuracion" (id, clave, valor, tipo, descripcion, "updated_at")
VALUES (
  gen_random_uuid(),
  'texto_rgpd',
  '<p><em>Conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).</em></p>'
  '<h2>1. Responsable del tratamiento</h2>'
  '<p><strong>Dragón de Madera</strong> (en adelante, «la Asociación»), con domicilio en Pepita Serrador 3, local 6, 18015 - Granada, es la responsable del tratamiento de los datos personales de sus socios y colaboradores. Contacto: info@dragondemadera.com.</p>'
  '<h2>2. Finalidad del tratamiento</h2>'
  '<p>Los datos recogidos se utilizan para:</p>'
  '<ul><li><p>Gestionar el alta, baja y situación de los socios.</p></li><li><p>Gestionar el cobro de cuotas y llevar la contabilidad de la Asociación.</p></li><li><p>Gestionar el préstamo de juegos de la ludoteca.</p></li><li><p>Comunicar novedades, convocatorias y actividades del club.</p></li><li><p>Cumplir con las obligaciones legales aplicables a las asociaciones culturales.</p></li></ul>'
  '<h2>3. Base jurídica</h2>'
  '<p>El tratamiento se basa en la relación contractual derivada de la condición de socio (art. 6.1.b RGPD), el cumplimiento de obligaciones legales (art. 6.1.c RGPD) y, en su caso, el consentimiento expreso del interesado para comunicaciones opcionales y la cesión a tiendas colaboradoras (art. 6.1.a RGPD).</p>'
  '<p>Para hacerse socio es obligatorio leer y aceptar esta política en el formulario de alta. En las cuotas conjuntas, quien rellena el formulario declara haber informado de ella a los demás miembros.</p>'
  '<h2>4. Datos tratados</h2>'
  '<ul><li><p>Datos identificativos: nombre, apellidos, DNI/NIE, fecha de nacimiento.</p></li><li><p>Datos de contacto: dirección, teléfono, correo electrónico.</p></li><li><p>Datos bancarios mínimos: comprobante de transferencia de cuota.</p></li><li><p>Datos de actividad en el club: préstamos, visitas, solicitud de llaves.</p></li><li><p>Anotaciones internas de la junta directiva relacionadas con su condición de socio.</p></li><li><p>Alias e identificador de Telegram (si el socio vincula voluntariamente su cuenta con el bot del club).</p></li></ul>'
  '<h2>5. Cesión a terceros</h2>'
  '<p>Los datos no se ceden a terceros salvo obligación legal o que el socio haya dado su consentimiento expreso para compartir nombre y apellidos con las tiendas colaboradoras de la Asociación a efectos de descuentos. Las tiendas no reciben ningún listado: el socio muestra en su área de socio un código QR que caduca a las 24 horas y, al escanearlo, la tienda ve solo su nombre y apellidos y que es socio activo. El socio puede retirar o volver a dar este consentimiento cuando quiera desde «Mi perfil».</p>'
  '<h2>6. Conservación de los datos</h2>'
  '<p>Los datos se conservan mientras dure la condición de socio.</p>'
  '<p><strong>Tras la baja, la Asociación no anonimiza ni elimina los datos:</strong> se conservan en su base de datos, con acceso restringido a la junta directiva, junto con el historial de cuotas, préstamos, visitas y juegos cedidos, para atender posibles responsabilidades y las obligaciones contables y fiscales. Puede pedir su supresión en cualquier momento (apartado 7); la Asociación la atenderá salvo en lo que deba conservar por obligación legal.</p>'
  '<p>Al causar baja:</p>'
  '<ul><li><p>Se desvincula su cuenta de Telegram y deja de recibir comunicaciones del club.</p></li><li><p>Se retira el consentimiento para compartir sus datos con las tiendas colaboradoras.</p></li><li><p>Pierde el acceso al área privada.</p></li><li><p>Sus datos quedan accesibles únicamente para la junta directiva.</p></li></ul>'
  '<h2>7. Derechos del interesado</h2>'
  '<p>El socio puede ejercer en cualquier momento los derechos de acceso, rectificación, supresión, oposición, portabilidad y limitación del tratamiento escribiendo a info@dragondemadera.com o por escrito al domicilio social.</p>'
  '<p>Si considera que el tratamiento de sus datos no es conforme a la normativa, puede presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es">www.aepd.es</a>).</p>'
  '<h2>8. Seguridad</h2>'
  '<p>La Asociación aplica las medidas técnicas y organizativas adecuadas para garantizar un nivel de seguridad apropiado al riesgo, incluyendo el cifrado de contraseñas y el acceso restringido a los datos según el rol de cada persona.</p>'
  '<h2>9. Cookies</h2>'
  '<p>El uso de cookies y almacenamiento local de esta web se explica en la <a href="/cookies">política de cookies</a>.</p>'
  '<p><em>Última actualización: noviembre de 2026.</em></p>',
  'texto_largo',
  'Política de privacidad mostrada en /rgpd (enlazada desde el formulario de alta)',
  NOW()
)
ON CONFLICT (clave) DO NOTHING;
