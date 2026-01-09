import { Link } from 'react-router-dom'
import { Header, Footer, PageHero, SectionHeading, WhatsAppButton, FaqButton } from '@/components/organisms'
import { FeatureItem } from '@/components/molecules'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SPACING } from '@/lib/constants'
import texts from '@/data/texts.json'

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <PageHero title={texts.home.hero.title} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className={`relative ${SPACING.sectionHero} bg-background`}>
          <div className={SPACING.container}>
            <div className={`grid lg:grid-cols-2 ${SPACING.contentGap} items-center`}>
              <div className={SPACING.itemsGap}>
                <h2
                  className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold ${SPACING.smallMargin} text-balance font-display text-card mb-4 sm:mb-6 md:mb-8`}
                >
                  {texts.home.hero.heading}
                </h2>

                <p className="text-xl sm:text-2xl md:text-3xl leading-tight text-pretty text-card leading-7 leading-tighter tracking-wide my-3">
                  {texts.home.hero.subtitle}
                </p>
                <p className="text-base sm:text-lg md:text-xl leading-relaxed text-card mb-2.5 leading-7 tracking-wide">
                  {texts.home.hero.description}
                </p>

                <ul className="space-y-2 sm:space-y-3">
                  {texts.home.hero.features.map((feature, i) => (
                    <FeatureItem key={i} text={feature} />
                  ))}
                </ul>

                <p className="text-base sm:text-lg md:text-xl leading-relaxed text-card mt-2.5 mb-6 sm:mb-8 md:mb-10 tracking-wide">
                  {texts.home.hero.callToAction}
                </p>

                <div className="text-center">
                  <WhatsAppButton />
                </div>
              </div>

              <div className="relative mt-8 lg:mt-0">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                  <img
                    src="/board-game-club-event-with-people-playing-games.jpg"
                    alt={texts.home.hero.imageAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* First Steps */}
        <section className={`${SPACING.section} text-primary-foreground bg-secondary text-center`}>
          <div className="inline-block px-4">
            <h3 className="font-semibold font-display mb-6 sm:mb-7 md:mb-9 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
              {texts.home.firstSteps.title}
            </h3>
            <div className={SPACING.itemsGap}>
              {texts.home.firstSteps.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-3 sm:gap-4 items-center text-center flex-row justify-start leading-7 tracking-wider my-2"
                >
                  <div className="flex-shrink-0 rounded-full bg-primary-foreground text-primary flex items-center justify-center font-bold text-lg sm:text-xl md:text-2xl size-7 sm:size-8">
                    {index + 1}
                  </div>
                  <p className="leading-relaxed text-left pt-0 text-base sm:text-lg md:text-xl lg:text-2xl tracking-wide">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calendar Section */}
        <section id="calendario" className={`${SPACING.section} mx-auto px-4 bg-accent text-center`}>
          <SectionHeading className="text-primary">{texts.home.calendar.title}</SectionHeading>
          <div className="w-full mx-auto">
            <iframe
              src="https://calendar.google.com/calendar/embed?height=600&wkst=2&ctz=Europe%2FMadrid&showPrint=0&showTitle=0&showCalendars=0&src=cGdvMmdmZHVjYm43MGQyZXFmYmNocXVvcG9AZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ&color=%23c0ca33"
              className="w-full block h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px]"
            ></iframe>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-left mt-2 tracking-wide">
              {texts.home.calendar.note}
            </p>
          </div>
        </section>

        {/* Instagram Gallery */}
        <section className={`${SPACING.section} bg-background text-card`}>
          <div className={SPACING.container}>
            <SectionHeading>{texts.home.instagram.title}</SectionHeading>
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:${SPACING.smallGap}`}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={`/board-games-event-photo-.jpg?height=400&width=400&query=board games event photo ${i}`}
                    alt={`${texts.home.instagram.imageAlt} ${i}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className={`${SPACING.section} bg-accent`}>
          <div className={SPACING.container}>
            <div className={SPACING.maxWidthNarrow}>
              <SectionHeading className="text-primary">{texts.home.faq.title}</SectionHeading>

              <Accordion type="single" collapsible className="space-y-3 sm:space-y-4 text-card">
                {texts.home.faq.items.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index + 1}`}
                    className="rounded-lg px-4 sm:px-5 md:px-6 border-0 bg-background text-card"
                  >
                    <AccordionTrigger className="text-base sm:text-lg md:text-xl text-left hover:no-underline font-display">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm sm:text-base md:text-lg leading-relaxed text-card">
                      {item.answer}
                      {item.button_text && item.button_href && (
                        <FaqButton text={item.button_text} href={item.button_href} />
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`${SPACING.section} bg-secondary text-background`}>
          <div className={`${SPACING.container} text-center`}>
            <SectionHeading className="text-background">{texts.home.cta.title}</SectionHeading>
            <p
              className={`text-base sm:text-lg md:text-xl tracking-wider ${SPACING.subheadingMargin} text-background px-4`}
            >
              {texts.home.cta.subtitle}
            </p>
            <div className="text-center px-4">
              <Button
                size="lg"
                asChild
                className="text-lg sm:text-xl md:text-2xl rounded-full border-0 px-5 py-4 sm:px-6 sm:py-5 md:p-6 font-display bg-background text-secondary font-bold w-full sm:w-auto"
              >
                <Link to="/club">{texts.home.cta.button}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
