import { Link } from 'react-router-dom'
import { Header, Footer, PageHero, SectionHeading, LudotecaTable } from '@/components/organisms'
import { MeepleIcon } from '@/components/atoms/icons'
import { Button } from '@/components/ui/button'
import { SPACING, SOCIAL_URLS } from '@/lib/constants'
import texts from '@/data/texts.json'

export function ClubPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <PageHero title={texts.club.hero.title} />

        {/* Club Features */}
        <section className={`${SPACING.section} bg-muted/50`}>
          <div className={SPACING.container}>
            <p
              className={`text-xl sm:text-2xl md:text-3xl text-center text-balance ${SPACING.headingMargin} ${SPACING.maxWidthNarrow} leading-relaxed px-4`}
            >
              {texts.club.features.text1}
            </p>
            <p
              className={`text-xl sm:text-2xl md:text-3xl text-center text-balance ${SPACING.headingMargin} ${SPACING.maxWidthNarrow} leading-relaxed px-4`}
            >
              {texts.club.features.text2}
            </p>
            <SectionHeading>{texts.club.features.title}</SectionHeading>

            <div
              className={`grid md:grid-cols-2 gap-6 sm:gap-8 md:${SPACING.itemsGap} ${SPACING.maxWidthWide} mt-12 sm:mt-14 md:mt-16`}
            >
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <MeepleIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display mb-4 sm:mb-5 md:mb-6">
                    {texts.club.rules.voluntariado.title}
                  </h3>
                </div>
                <p className="text-base sm:text-lg md:text-xl font-medium">{texts.club.rules.voluntariado.subtitle}</p>
                <ul className="space-y-2">
                  {texts.club.rules.voluntariado.items.map((item: string, i: number) => (
                    <li key={i} className="text-sm sm:text-base md:text-lg text-balance flex gap-2">
                      <span>-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <MeepleIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display mb-4 sm:mb-5 md:mb-6">
                    {texts.club.rules.convivencia.title}
                  </h3>
                </div>
                <p className="text-base sm:text-lg md:text-xl font-medium">{texts.club.rules.convivencia.subtitle}</p>
                <ul className="space-y-2">
                  {texts.club.rules.convivencia.items.map((item: string, i: number) => (
                    <li key={i} className="text-sm sm:text-base md:text-lg text-balance flex gap-2">
                      <span>-</span>
                      <span>{item}</span>
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
            <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center max-w-6xl mx-auto">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="/empty-board-game-club-with-shelves-and-spacious-ro.jpg"
                  alt="Nuestro local"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-6 sm:space-y-8 px-4">
                <p className="text-xl sm:text-2xl md:text-3xl leading-tight">{texts.club.local.subtitle}</p>
                <ul className="space-y-3 sm:space-y-4">
                  {texts.club.local.items.map((item: string, i: number) => (
                    <li key={i} className="flex gap-2 sm:gap-3 items-center text-base sm:text-lg md:text-xl font-bold">
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
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center max-w-6xl mx-auto">
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

              <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6 sm:space-y-8 px-4">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xl sm:text-2xl md:text-3xl">{texts.common.clubName}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl">{texts.common.address.street}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl">{texts.common.address.city}</p>
                </div>

                <Button
                  size="lg"
                  asChild
                  className="text-lg sm:text-xl md:text-2xl bg-background text-secondary rounded-full border-0 px-5 py-4 sm:px-6 sm:py-5 md:p-6 font-display w-full sm:w-auto"
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
            <div className={`${SPACING.maxWidthNarrow} space-y-3 sm:space-y-4 mb-8 sm:mb-10 md:mb-12 px-4`}>
              <p className="text-base sm:text-lg md:text-xl leading-relaxed">{texts.club.library.subtitle}</p>
              <p className="text-base sm:text-lg md:text-xl leading-relaxed">{texts.club.library.description}</p>
              <p className="text-base sm:text-lg md:text-xl font-medium mt-6 sm:mt-8">{texts.club.library.tableNote}</p>
            </div>

            <LudotecaTable />

            <div className={`${SPACING.maxWidthNarrow} px-4 mt-12 sm:mt-14 md:mt-16`}>
              <h3
                className={`text-2xl sm:text-3xl md:text-4xl font-bold ${SPACING.smallMargin} text-balance mb-4 sm:mb-5 md:mb-6 text-center`}
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
                  className="font-display bg-secondary text-white hover:bg-secondary/90 text-lg sm:text-xl md:text-2xl px-6 py-5 sm:px-8 sm:py-6 md:px-10 md:py-7 rounded-full shadow-lg transition-transform hover:scale-105 w-full sm:w-auto"
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
          <div className={`${SPACING.container} text-center px-4`}>
            <SectionHeading className="text-background">{texts.club.cta.title}</SectionHeading>
            <p className={`text-base sm:text-lg md:text-xl text-background ${SPACING.subheadingMargin}`}>
              {texts.club.cta.subtitle}
            </p>
            <Button
              size="lg"
              asChild
              className="text-lg sm:text-xl md:text-2xl text-secondary rounded-full border-0 px-5 py-4 sm:px-6 sm:py-5 md:p-6 font-display bg-background w-full sm:w-auto"
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
