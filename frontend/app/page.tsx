import { Header } from "@/components/header"
import { MeepleIcon } from "@/components/meeple-icon"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import texts from "@/texts.json"
import { SPACING } from "@/lib/constants"



const calendarSrc =
  "https://calendar.google.com/calendar/u/0/embed?src=pgo2gfducbn70d2eqfbchquopo@group.calendar.google.com&ctz=Europe/Madrid&pli=1"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className={`${SPACING.section} bg-secondary text-background opacity-100`}>
        <div className={`${SPACING.container} text-center`}>
          <h1 className="text-6xl md:text-7xl font-bold text-balance leading-tight font-display lg:text-6xl">
            {texts.home.hero.title}
          </h1>
        </div>
      </section>

      <main className="flex-1">
        {/* Hero Section */}
        <section className={`relative ${SPACING.sectionHero} bg-background`}>
          <div className={SPACING.container}>
            <div className={`grid lg:grid-cols-2 ${SPACING.contentGap} items-center`}>
              <div className={SPACING.itemsGap}>
                <h2
                  className={`text-5xl font-bold ${SPACING.smallMargin} text-balance font-display text-card md:text-5xl`}
                >
                  {texts.home.hero.heading}
                </h2>

                <p className="text-3xl text-pretty leading-relaxed text-card">{texts.home.hero.subtitle}</p>
                <p className="text-xl leading-relaxed text-card mb-2.5">{texts.home.hero.description}</p>

                <ul className="space-y-3">
                  {texts.home.hero.features.map((feature, i) => (
                    <li key={i} className="flex gap-3 items-center">
                      <MeepleIcon className="h-8 w-8 text-accent shrink-0 mt-0.5" />
                      <span className="text-xl text-card">{feature}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-xl leading-relaxed text-card mt-2.5 mb-10">{texts.home.hero.callToAction}</p>

                <div className="text-center">
                  <Button
                    size="lg"
                    asChild
                    className="text-2xl text-background rounded-full border-0 p-6 font-display bg-primary"
                  >
                    <a href="https://chat.whatsapp.com" target="_blank" rel="noopener noreferrer">
                      {texts.common.whatsappGroup}
                    </a>
                  </Button>
                </div>
              </div>

              <div className="relative">
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
          <div className="inline-block">
            <h3 className="font-semibold font-display mb-9 text-5xl">{texts.home.firstSteps.title}</h3>
            <div className={SPACING.itemsGap}>
              {texts.home.firstSteps.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-4 items-center text-center flex-row justify-start leading-7 tracking-wider"
                >
                  <div className="flex-shrink-0 rounded-full bg-primary-foreground text-primary flex items-center justify-center font-bold text-2xl size-8">
                    {index + 1}
                  </div>
                  <p className="leading-relaxed text-center pt-0 text-2xl">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calendar Section */}
        <section className={`${SPACING.section} mx-auto px-4 bg-accent text-center`}>
          <h2
            className={`text-5xl md:text-6xl font-bold ${SPACING.paragraphMargin} text-balance font-display text-primary`}
          >
            {texts.home.calendar.title}
          </h2>
          <div className="w-6/7 mx-auto">
            <iframe
              src="https://calendar.google.com/calendar/embed?height=700&wkst=2&ctz=Europe%2FLondon&showPrint=0&showTz=0&showCalendars=0&showTitle=0&src=OWI0MWUxYzJjMTRlYjFiNjkwYzkyNWI3NWQyMDg1ODg3ZDkxMjkzZDIxMmMwNjdmMzRlNDMwNTVlYzFlNjBiZEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%23ad1457"
              height="700"
              className="w-full block"
            ></iframe>
            <p className="text-2xl text-left mt-2">{texts.home.calendar.note}</p>
          </div>
        </section>

        {/* Instagram Gallery */}
        <section className={`${SPACING.section} bg-background text-card`}>
          <div className={SPACING.container}>
            <h2
              className={`text-5xl md:text-6xl font-bold ${SPACING.subheadingMargin} text-center text-balance font-display`}
            >
              {texts.home.instagram.title}
            </h2>
            <div className={`grid grid-cols-2 md:grid-cols-3 ${SPACING.smallGap}`}>
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
              <h2
                className={`text-5xl md:text-6xl font-bold ${SPACING.subheadingMargin} text-center text-balance font-display text-primary`}
              >
                {texts.home.faq.title}
              </h2>

              <Accordion type="single" collapsible className="space-y-4 text-card">
                {texts.home.faq.items.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index + 1}`}
                    className="rounded-lg px-6 border-0 bg-background text-card"
                  >
                    <AccordionTrigger className="text-xl text-left hover:no-underline font-display">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-lg leading-relaxed text-card">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`${SPACING.section} bg-secondary text-background`}>
          <div className={`${SPACING.container} text-center`}>
            <h2 className={`text-5xl md:text-6xl font-bold ${SPACING.smallMargin} text-balance font-display`}>
              {texts.home.cta.title}
            </h2>
            <p className={`text-xl ${SPACING.subheadingMargin} text-background`}>{texts.home.cta.subtitle}</p>
            <div className="text-center">
              <Button
                size="lg"
                asChild
                className="text-2xl rounded-full border-0 p-6 font-display bg-background text-secondary font-bold"
              >
                <Link href="/club">
                  {texts.home.cta.button}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
