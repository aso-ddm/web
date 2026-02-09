import { Header, Footer, PageHero, SectionHeading, WhatsAppButton } from '@/components/organisms'
import { MeepleIcon } from '@/components/atoms/icons'
import { Card, CardContent } from '@/components/ui/card'
import { SPACING } from '@/lib/constants'
import { SEOHead } from '@/components/SEOHead'
import texts from '@/data/texts.json'

export function SocioPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Hazte Socio"
        description="Únete al club Dragón de Madera. Descubre las ventajas de ser socio y disfruta de juegos de mesa en Granada."
        path="/socio"
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <PageHero title={texts.member.hero.title} />

        {/* How to Join */}
        <section className={SPACING.section}>
          <div className={SPACING.container}>
            <div className={SPACING.maxWidthContent}>
              <p
                className={`text-xl sm:text-2xl md:text-3xl text-center text-balance ${SPACING.headingMargin} ${SPACING.maxWidthNarrow} leading-relaxed ${SPACING.padXSm}`}
              >
                {texts.member.howToJoin.text1}
              </p>
              <p
                className={`text-xl sm:text-2xl md:text-3xl text-center text-balance ${SPACING.headingMargin} ${SPACING.maxWidthNarrow} leading-relaxed ${SPACING.padXSm}`}
              >
                {texts.member.howToJoin.text2}
              </p>
              {/* Section Heading */}
              <SectionHeading>{texts.member.howToJoin.title}</SectionHeading>

              {/* Steps 1 and 2 */}
              <div className={`grid ${SPACING.gapLg} max-w-5xl mx-auto ${SPACING.padXSm}`}>
                <div className={`grid md:grid-cols-2 ${SPACING.gapLg}`}>
                  {/* Step 1 */}
                  <div className={`bg-accent rounded-lg ${SPACING.padLg} relative pt-16 sm:pt-12 text-center shadow-md`}>
                    <div className="absolute -top-6 -left-6 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl sm:text-3xl font-display font-bold">
                      1
                    </div>
                    <h3 className={`text-2xl sm:text-3xl md:text-4xl font-display font-bold text-primary ${SPACING.marginBottomSm}`}>
                      {texts.member.howToJoin.steps[0].title}
                    </h3>
                    <p className="text-base sm:text-lg md:text-xl text-primary font-bold leading-tight">
                      <span className="block font-bold">Gasta tus 3 invitaciones</span>
                      <span className="block font-normal">gratuitas para conocernos.</span>
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className={`bg-accent rounded-lg ${SPACING.padLg} relative pt-16 sm:pt-12 text-center shadow-md`}>
                    <div className="absolute -top-6 -left-6 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl sm:text-3xl font-display font-bold">
                      2
                    </div>
                    <h3 className={`text-2xl sm:text-3xl md:text-4xl font-display font-bold text-primary ${SPACING.marginBottomSm}`}>
                      {texts.member.howToJoin.steps[1].title}
                    </h3>
                    <p className="text-base sm:text-lg md:text-xl text-primary leading-tight">
                      <span className="block">Con pase de día por 4€</span>
                      <span className="block font-bold">o hazte socio.</span>
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`bg-secondary rounded-lg ${SPACING.padLg} relative ${SPACING.marginTopSm} shadow-md text-primary-foreground`}>
                  <div className="absolute -top-6 -left-6 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl sm:text-3xl font-display font-bold">
                    3
                  </div>
                  <h3 className={`text-3xl sm:text-4xl md:text-5xl font-display font-bold text-center ${SPACING.marginBottomLg} pt-6 md:pt-0`}>
                    {texts.member.howToJoin.steps[2].title}
                  </h3>

                  <div className={`grid md:grid-cols-3 ${SPACING.gapLg} items-center`}>
                    <div className={`flex flex-col items-center text-center ${SPACING.gapXs}`}>
                      <p className="text-base sm:text-lg md:text-xl leading-tight">
                        {texts.member.howToJoin.steps[2].items?.[0]}
                      </p>
                    </div>

                    <div className={`bg-primary-foreground/15 rounded-lg ${SPACING.padYMd} ${SPACING.padXSm} text-center md:scale-110`}>
                      <p className="text-2xl sm:text-3xl font-bold text-primary-foreground whitespace-nowrap">{texts.member.howToJoin.steps[2].items?.[1]}</p>
                    </div>

                    <div className={`flex flex-col items-center text-center ${SPACING.gapXs}`}>
                      <p className="text-base sm:text-lg md:text-xl leading-tight">
                        {texts.member.howToJoin.steps[2].items?.[2]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className={`${SPACING.section} bg-accent`}>
          <div className={SPACING.container}>
            <SectionHeading className="text-primary">{texts.member.benefits.title}</SectionHeading>

            <div
              className={`grid sm:grid-cols-2 lg:grid-cols-3 ${SPACING.gapMd} ${SPACING.maxWidthWide}`}
            >
              {texts.member.benefits.items.map((benefit, i) => {
                return (
                  <Card key={i} className="bg-background">
                    <CardContent
                      className={`${SPACING.padMd} flex flex-col items-center text-center`}
                    >
                      <MeepleIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent mb-2" />
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed">{benefit}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`${SPACING.section} bg-secondary`}>
          <div className={`${SPACING.container} text-center ${SPACING.padXSm}`}>
            <SectionHeading className="text-background">{texts.member.cta.title}</SectionHeading>
            <p
              className={`text-base sm:text-lg md:text-xl ${SPACING.subheadingMargin} ${SPACING.maxWidthForm} leading-relaxed text-background`}
            >
              {texts.member.cta.subtitle}
            </p>
            {/* WhatsApp Button */}
            <WhatsAppButton variant="secondary" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
