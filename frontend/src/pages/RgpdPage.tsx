import { Link } from 'react-router-dom'
import { Header, Footer } from '@/components/organisms'
import { SPACING } from '@/lib/constants'
import { SEOHead } from '@/components/SEOHead'
import texts from '@/data/texts.json'

export function RgpdPage() {
  return (
    <>
      <SEOHead
        title="Política de privacidad y protección de datos — Dragón de Madera"
        description="Información sobre el tratamiento de datos personales de los socios de Dragón de Madera conforme al RGPD."
        path="/rgpd"
      />
      <Header />

      <main className={`${SPACING.container} ${SPACING.padYLg}`}>
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-primary mb-2">
              Política de privacidad
            </h1>
            <p className="text-muted-foreground">
              Conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD)
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-primary">1. Responsable del tratamiento</h2>
            <p className="text-sm leading-relaxed">
              <strong>{texts.common.clubName}</strong> (en adelante, «la Asociación»), con domicilio en{' '}
              {texts.common.address.street}, {texts.common.address.city}, es la responsable del tratamiento
              de los datos personales de sus socios y colaboradores.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-primary">2. Finalidad del tratamiento</h2>
            <p className="text-sm leading-relaxed">Los datos recogidos se utilizan para:</p>
            <ul className="list-disc list-inside text-sm leading-relaxed space-y-1 ml-2">
              <li>Gestionar el alta, baja y situación de los socios.</li>
              <li>Gestionar el cobro de cuotas y llevar la contabilidad de la Asociación.</li>
              <li>Gestionar el préstamo de juegos de la ludoteca.</li>
              <li>Comunicar novedades, convocatorias y actividades del club.</li>
              <li>Cumplir con las obligaciones legales aplicables a las asociaciones culturales.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-primary">3. Base jurídica</h2>
            <p className="text-sm leading-relaxed">
              El tratamiento se basa en la relación contractual derivada de la condición de socio (art. 6.1.b RGPD),
              el cumplimiento de obligaciones legales (art. 6.1.c RGPD) y, en su caso, el consentimiento expreso
              del interesado para comunicaciones opcionales (art. 6.1.a RGPD).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-primary">4. Datos tratados</h2>
            <p className="text-sm leading-relaxed">Se tratan los siguientes datos personales:</p>
            <ul className="list-disc list-inside text-sm leading-relaxed space-y-1 ml-2">
              <li>Datos identificativos: nombre, apellidos, DNI/NIE, fecha de nacimiento.</li>
              <li>Datos de contacto: dirección, teléfono, correo electrónico.</li>
              <li>Datos bancarios mínimos: comprobante de transferencia de cuota.</li>
              <li>Datos de actividad en el club: préstamos, visitas, solicitud de llaves.</li>
              <li>Alias de Telegram (si el socio lo facilita voluntariamente).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-primary">5. Cesión a terceros</h2>
            <p className="text-sm leading-relaxed">
              Los datos no se ceden a terceros salvo obligación legal, salvo que el socio haya dado su
              consentimiento expreso para compartir nombre y apellidos con las tiendas colaboradoras de la
              Asociación a efectos de descuentos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-primary">6. Conservación de los datos</h2>
            <p className="text-sm leading-relaxed">
              Los datos se conservarán durante la vigencia de la condición de socio y, una vez causada baja,
              durante el plazo legalmente exigible para atender posibles responsabilidades y cumplir obligaciones
              contables y fiscales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-primary">7. Derechos del interesado</h2>
            <p className="text-sm leading-relaxed">
              El socio puede ejercer en cualquier momento los derechos de acceso, rectificación, supresión,
              oposición, portabilidad y limitación del tratamiento, dirigiéndose a la Asociación a través
              de la dirección de contacto habitual o por escrito al domicilio social.
            </p>
            <p className="text-sm leading-relaxed">
              Si considera que el tratamiento de sus datos no es conforme a la normativa, puede presentar
              una reclamación ante la Agencia Española de Protección de Datos (
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                www.aepd.es
              </a>
              ).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-primary">8. Seguridad</h2>
            <p className="text-sm leading-relaxed">
              La Asociación aplica las medidas técnicas y organizativas adecuadas para garantizar un nivel
              de seguridad apropiado al riesgo, incluyendo el cifrado de contraseñas y el acceso restringido
              a los datos según el rol de cada persona.
            </p>
          </section>

          <div className="pt-4 border-t border-border text-sm text-muted-foreground">
            <p>Última actualización: junio de 2026</p>
            <Link to="/" className="text-primary underline mt-1 inline-block">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
