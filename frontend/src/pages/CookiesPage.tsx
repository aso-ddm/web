import { Link } from 'react-router-dom'
import { Header, Footer } from '@/components/organisms'
import { Button } from '@/components/ui/button'
import { SPACING } from '@/lib/constants'
import { SEOHead } from '@/components/atoms/SEOHead'
import { decidirCookies, useDecisionCookies } from '@/lib/cookies'

// Si se añade algo que guarde datos en el navegador o un contenido de terceros, se refleja aquí
const PROPIAS = [
  ['dragon-auth', 'localStorage', 'Mantiene tu sesión iniciada en el área de socios. Se borra al cerrar sesión.'],
  ['dragon-cookies', 'localStorage', 'Recuerda si aceptaste o rechazaste las cookies de terceros.'],
  ['chunk-reload', 'sessionStorage', 'Evita recargas en bucle tras una actualización de la web. Se borra al cerrar la pestaña.'],
]

export function CookiesPage() {
  const decision = useDecisionCookies()

  return (
    <>
      <SEOHead title="Política de cookies" description="Qué cookies y almacenamiento local usa la web de Dragón de Madera." path="/cookies" />
      <Header />

      <main className={`${SPACING.container} ${SPACING.padYLg}`}>
        <div className="max-w-3xl mx-auto space-y-8 text-sm leading-relaxed">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-primary">Política de cookies</h1>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-primary">Propias (técnicas)</h2>
            <p>
              La web no usa cookies propias ni de analítica o publicidad. Guarda en tu navegador solo lo imprescindible para
              funcionar, que no necesita tu consentimiento (art. 22.2 LSSI):
            </p>
            <ul className="list-disc ml-5 space-y-1">
              {PROPIAS.map(([nombre, donde, para]) => (
                <li key={nombre}><code>{nombre}</code> ({donde}): {para}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-primary">De terceros</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                <strong>Google Maps</strong> (mapa de «El club») y <strong>Google Calendar</strong> (calendario de la página de inicio):
                Google puede instalar sus cookies. <strong>Solo se cargan si las aceptas</strong>; si no, ves un aviso con un enlace para abrirlos en Google.
              </li>
              <li>
                <strong>Telegram</strong>: el botón para entrar o vincular tu cuenta con Telegram carga un componente de Telegram, que
                instala sus cookies solo cuando lo usas, porque lo pides tú.
              </li>
              <li>
                La hoja de Google con el catálogo público de la ludoteca no instala cookies, pero tu navegador se conecta a Google
                para descargarla. Las tipografías se sirven desde nuestro servidor.
              </li>
            </ul>
            <p>
              Consulta cómo usa Google los datos en{' '}
              <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer" className="text-primary underline">su política de cookies</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-primary">Tu elección</h2>
            <p>
              Cookies de terceros:{' '}
              <strong>{decision === 'aceptadas' ? 'aceptadas' : decision === 'rechazadas' ? 'rechazadas' : 'sin decidir'}</strong>.
              Puedes cambiarlo cuando quieras. También puedes borrar las cookies desde la configuración de tu navegador.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={decision === 'rechazadas'} onClick={() => decidirCookies('rechazadas')}>Rechazar</Button>
              <Button variant="outline" disabled={decision === 'aceptadas'} onClick={() => decidirCookies('aceptadas')}>Aceptar</Button>
            </div>
          </section>

          <div className="pt-4 border-t border-border space-y-1">
            <p className="text-muted-foreground">Última actualización: noviembre de 2026</p>
            <p>
              <Link to="/rgpd" className="text-primary underline">Política de privacidad</Link>
              {' · '}
              <Link to="/" className="text-primary underline">Volver al inicio</Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
