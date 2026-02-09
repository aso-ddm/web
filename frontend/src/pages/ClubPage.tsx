import { Link } from 'react-router-dom'
import { Header, Footer, PageHero, SectionHeading, LudotecaTable } from '@/components/organisms'
import { MeepleIcon } from '@/components/atoms/icons'
import { Button } from '@/components/ui/button'
import { SPACING, SOCIAL_URLS } from '@/lib/constants'
import { SEOHead } from '@/components/SEOHead'
import texts from '@/data/texts.json'
import images from '@/data/images.json'

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
          </div>

            <div
              className={`grid md:grid-cols-2 w-full md:w-[50%] mx-auto gap-8 md:gap-0 ${SPACING.marginTopLg}`}
            >
              <div className={`${SPACING.spaceYMd} flex flex-col items-center justify-start ${SPACING.padXSm}`}>
                <div className={`flex items-center ${SPACING.gapSm} ${SPACING.marginBottomSm} justify-center`}>
                  <MeepleIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary flex-shrink-0" />
                  <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold font-display`}>
                    {texts.club.rules.voluntariado.title}
                  </h3>
                </div>
                <p className="text-base sm:text-lg md:text-xl font-medium text-center">{texts.club.rules.voluntariado.subtitle}</p>
                <ul className={`${SPACING.spaceYXs} inline-block text-left`}>
                  {texts.club.rules.voluntariado.items.map((item: string, i: number) => {
                    const isLast = i === texts.club.rules.voluntariado.items.length - 1
                    const parts = isLast ? item.split(', ') : [item]
                    return (
                      <li key={i} className={`text-sm sm:text-base md:text-lg text-balance flex ${SPACING.gapXs}`}>
                        <span>-</span>
                        <span>
                          {isLast && parts.length > 1 ? (
                            <>
                              {parts[0]},
                              <br />
                              {parts.slice(1).join(', ')}
                            </>
                          ) : (
                            item
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className={`${SPACING.spaceYMd} flex flex-col items-center justify-start ${SPACING.padXSm}`}>
                <div className={`flex items-center ${SPACING.gapSm} ${SPACING.marginBottomSm} justify-center`}>
                  <MeepleIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary flex-shrink-0" />
                  <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold font-display`}>
                    {texts.club.rules.convivencia.title}
                  </h3>
                </div>
                <p className="text-base sm:text-lg md:text-xl font-medium text-center">{texts.club.rules.convivencia.subtitle}</p>
                <ul className={`${SPACING.spaceYXs} inline-block text-left`}>
                  {texts.club.rules.convivencia.items.map((item: string, i: number) => {
                    const isLast = i === texts.club.rules.convivencia.items.length - 1
                    const parts = isLast ? item.split(', ') : [item]
                    return (
                      <li key={i} className={`text-sm sm:text-base md:text-lg text-balance flex ${SPACING.gapXs}`}>
                        <span>-</span>
                        <span>
                          {isLast && parts.length > 1 ? (
                            <>
                              {parts[0]},
                              <br />
                              {parts.slice(1).join(', ')}
                            </>
                          ) : (
                            item
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
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
              <div className="aspect-video bg-muted rounded-xl overflow-hidden border-2 border-primary-foreground/20 shadow-xl">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3179.089!2d-3.614!3d37.177!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDEwJzM3LjIiTiAzwrAzNic1MC40Ilc!5e0!3m2!1ses!2ses!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

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
                    href="https://www.google.com/maps/search/?api=1&query=Pepita+Serrador+3,+Granada"
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
