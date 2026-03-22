import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header, Footer, PageHero, SectionHeading, LudotecaTable } from '@/components/organisms'
import { MeepleIcon } from '@/components/atoms/icons'
import { Button } from '@/components/ui/button'
import { SPACING, SOCIAL_URLS } from '@/lib/constants'
import { SEOHead } from '@/components/SEOHead'
import texts from '@/data/texts.json'
import images from '@/data/images.json'

function MapEmbed() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="aspect-video rounded-xl overflow-hidden border-2 border-primary-foreground/20 shadow-xl relative">
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10 sm:h-14 sm:w-14 text-muted-foreground/40"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
      )}
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6356.9823074686565!2d-3.627495!3d37.188562!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd71fc50a6283c5b%3A0xc821938f069bf5b8!2sDrag%C3%B3n%20de%20Madera!5e0!3m2!1ses!2ses!4v1772530904025!5m2!1ses!2ses"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

export function ClubPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="El Club"
        description="Conoce el club Dragón de Madera en Granada. Más de 800 juegos de mesa, partidas semanales y eventos especiales."
        path="/club"
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <PageHero title={texts.club.hero.title} />

        {/* Club Features */}
        <section className={`${SPACING.section} bg-muted/50`}>
          <div className={SPACING.container}>
            <p
              className={`text-xl sm:text-2xl md:text-3xl text-center text-balance ${SPACING.headingMargin} ${SPACING.maxWidthNarrow} leading-relaxed ${SPACING.padXSm}`}
            >
              {texts.club.features.text1}
            </p>
            <p
              className={`text-xl sm:text-2xl md:text-3xl text-center text-balance ${SPACING.headingMargin} ${SPACING.maxWidthNarrow} leading-relaxed ${SPACING.padXSm}`}
            >
              {texts.club.features.text2}
            </p>
            <SectionHeading>{texts.club.features.title}</SectionHeading>

            <div className={`grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto ${SPACING.marginTopSm}`}>
              {/* Voluntariado */}
              <div className="bg-secondary rounded-xl p-6 sm:p-8 shadow-md flex flex-col">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-secondary-foreground mb-2">
                  {texts.club.rules.voluntariado.title}
                </h3>
                <p className="text-base sm:text-lg md:text-xl font-semibold text-secondary-foreground/80 mb-5 sm:mb-6">
                  {texts.club.rules.voluntariado.subtitle}
                </p>
                <ul className="space-y-3 sm:space-y-4">
                  {texts.club.rules.voluntariado.items.map((item: string, i: number) => (
                    <li key={i} className="flex gap-3 items-start">
                      <MeepleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground/50 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base md:text-lg leading-snug text-secondary-foreground">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Convivencia */}
              <div className="bg-primary rounded-xl p-6 sm:p-8 shadow-md flex flex-col">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-primary-foreground mb-2">
                  {texts.club.rules.convivencia.title}
                </h3>
                <p className="text-base sm:text-lg md:text-xl font-semibold text-primary-foreground/80 mb-5 sm:mb-6">
                  {texts.club.rules.convivencia.subtitle}
                </p>
                <ul className="space-y-3 sm:space-y-4">
                  {texts.club.rules.convivencia.items.map((item: string, i: number) => (
                    <li key={i} className="flex gap-3 items-start">
                      <MeepleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground/50 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base md:text-lg leading-snug text-primary-foreground">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Local Section */}
        <section className={`${SPACING.section} bg-accent`}>
          <div className={SPACING.container}>
            <SectionHeading className="text-primary">{texts.club.local.title}</SectionHeading>
            <div className={`grid md:grid-cols-2 ${SPACING.gapXl} items-center max-w-6xl mx-auto`}>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={images.club.local}
                  alt="Nuestro local"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className={`${SPACING.spaceYLg} ${SPACING.padXSm}`}>
                <p className="text-xl sm:text-2xl md:text-3xl leading-tight">{texts.club.local.subtitle}</p>
                <ul className={SPACING.spaceYMd}>
                  {texts.club.local.items.map((item: string, i: number) => (
                    <li key={i} className={`flex ${SPACING.gapSm} items-center text-base sm:text-lg md:text-xl font-bold`}>
                      <MeepleIcon className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className={`${SPACING.section} bg-secondary text-primary-foreground`}>
          <div className={SPACING.container}>
            <SectionHeading>{texts.club.location.title}</SectionHeading>
            <div className={`grid md:grid-cols-2 ${SPACING.gapLg} items-center max-w-6xl mx-auto`}>
              <MapEmbed />

              <div className={`flex flex-col items-center md:items-start text-center md:text-left ${SPACING.spaceYLg} ${SPACING.padXSm}`}>
                <div className={SPACING.spaceYXs}>
                  <p className="text-xl sm:text-2xl md:text-3xl">{texts.common.clubName}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl">{texts.common.address.street}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl">{texts.common.address.city}</p>
                </div>

                <Button
                  size="lg"
                  asChild
                  className={`text-lg sm:text-xl md:text-2xl bg-background text-secondary rounded-full border-0 px-12 py-4 sm:px-20 sm:py-6 font-display w-full sm:w-auto`}
                >
                  <a
                    href="https://maps.app.goo.gl/i4RijwbrQFAHwfww9"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {texts.club.location.button}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Ludoteca Section */}
        <section className={SPACING.section}>
          <div className={`${SPACING.container} flex flex-col items-center`}>
            <SectionHeading>{texts.club.library.title}</SectionHeading>
            <div className={`${SPACING.maxWidthNarrow} ${SPACING.spaceYMd} ${SPACING.marginBottomLg} ${SPACING.padXSm}`}>
              <p className="text-base sm:text-lg md:text-xl leading-relaxed">{texts.club.library.subtitle}</p>
              <p className="text-base sm:text-lg md:text-xl leading-relaxed">{texts.club.library.description}</p>
              <p className={`text-base sm:text-lg md:text-xl font-medium ${SPACING.marginTopMd}`}>{texts.club.library.tableNote}</p>
            </div>

            <LudotecaTable />

            <div className={`${SPACING.maxWidthNarrow} ${SPACING.padXSm} ${SPACING.marginTopLg}`}>
              <h3
                className={`text-2xl sm:text-3xl md:text-4xl font-bold text-balance ${SPACING.marginBottomSm} text-center`}
              >
                {texts.club.library.moreGames.title}
              </h3>
              <p className={`text-base sm:text-lg md:text-xl ${SPACING.paragraphMargin} leading-relaxed text-center`}>
                {texts.club.library.moreGames.description}
              </p>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  asChild
                  className={`font-display bg-secondary text-white hover:bg-secondary/90 text-lg sm:text-xl md:text-2xl px-18 py-6 sm:px-24 sm:py-8 rounded-full shadow-lg transition-transform hover:scale-105 w-full sm:w-auto`}
                >
                  <a href={SOCIAL_URLS.whatsapp} target="_blank" rel="noopener noreferrer">
                    {texts.common.whatsappGroup}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`${SPACING.section} bg-muted/50 bg-secondary`}>
          <div className={`${SPACING.container} text-center ${SPACING.padXSm}`}>
            <SectionHeading className="text-background">{texts.club.cta.title}</SectionHeading>
            <p className={`text-base sm:text-lg md:text-xl text-background ${SPACING.subheadingMargin}`}>
              {texts.club.cta.subtitle}
            </p>
            <Button
              size="lg"
              asChild
              className={`text-lg sm:text-xl md:text-2xl text-secondary rounded-full border-0 px-12 py-4 sm:px-20 sm:py-6 font-display bg-background w-full sm:w-auto`}
            >
              <Link to="/socio">{texts.club.cta.button}</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
