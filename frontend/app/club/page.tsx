import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Clock, Thermometer, Users, Heart, MessageCircle } from "lucide-react"
import Link from "next/link"
import texts from "@/texts.json"
import { SPACING } from "@/lib/constants"

export default function ClubPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className={SPACING.sectionHero}>
          <div className={SPACING.container}>
            <div className={`grid lg:grid-cols-2 ${SPACING.contentGap} items-center`}>
              <div className={SPACING.itemsGap}>
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-balance leading-tight font-display">
                  {texts.club.hero.title}
                </h1>
                <p className="text-3xl text-muted-foreground leading-relaxed text-pretty">{texts.club.hero.subtitle}</p>
              </div>

              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                  <img
                    src="/empty-board-game-club-with-shelves-and-spacious-ro.jpg"
                    alt={texts.club.hero.imageAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Club Features */}
        <section className={`${SPACING.section} bg-muted/50`}>
          <div className={SPACING.container}>
            <h2
              className={`text-5xl md:text-6xl font-bold ${SPACING.headingMargin} text-center text-balance font-display`}
            >
              {texts.club.features.title}
            </h2>
            <p
              className={`text-3xl text-center text-muted-foreground ${SPACING.headingMargin} ${SPACING.maxWidthNarrow} leading-relaxed`}
            >
              {texts.club.features.subtitle}
            </p>

            <div className={`grid md:grid-cols-2 lg:grid-cols-3 ${SPACING.itemsGap} ${SPACING.maxWidthWide}`}>
              {texts.club.features.items.map((feature, i) => {
                const iconMap: Record<string, any> = {
                  "Sin horario fijo": Clock,
                  "Amplio y bien iluminado": MapPin,
                  "Bien comunicado": MapPin,
                  Comodidades: Users,
                  Climatizado: Thermometer,
                  "Ambiente tranquilo": Heart,
                }
                const Icon = iconMap[feature.title] || MapPin
                return (
                  <Card key={i}>
                    <CardContent className={SPACING.cardPadding}>
                      <Icon className="h-14 w-14 text-primary mb-4" />
                      <h3 className={`font-semibold text-2xl ${SPACING.smallMargin} font-display`}>{feature.title}</h3>
                      <p className="text-xl text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className={SPACING.section}>
          <div className={SPACING.container}>
            <h2
              className={`text-5xl md:text-6xl font-bold ${SPACING.subheadingMargin} text-center text-balance font-display`}
            >
              {texts.club.location.title}
            </h2>
            <div className={SPACING.maxWidthContent}>
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-[16/9] bg-muted rounded-lg overflow-hidden">
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
                  <div className={`${SPACING.cardPadding} text-center`}>
                    <p className="text-2xl font-medium">{texts.common.address.street}</p>
                    <p className="text-xl text-muted-foreground">{texts.common.address.city}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className={`${SPACING.section} bg-primary text-primary-foreground`}>
          <div className={SPACING.container}>
            <h2
              className={`text-5xl md:text-6xl font-bold ${SPACING.headingMargin} text-center text-balance font-display`}
            >
              {texts.club.values.title}
            </h2>
            <div className={`${SPACING.maxWidthContent} ${SPACING.itemsGap}`}>
              {texts.club.values.items.map((value, i) => (
                <Card key={i} className="bg-primary-foreground/10 border-primary-foreground/20">
                  <CardContent className={SPACING.cardPadding}>
                    <h3 className={`font-bold text-3xl ${SPACING.smallMargin} font-display`}>{value.title}</h3>
                    <p className="text-xl leading-relaxed opacity-90">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Game Library */}
        <section className={SPACING.section}>
          <div className={SPACING.container}>
            <h2
              className={`text-5xl md:text-6xl font-bold ${SPACING.paragraphMargin} text-center text-balance font-display`}
            >
              {texts.club.library.title}
            </h2>
            <p
              className={`text-3xl text-center text-muted-foreground ${SPACING.headingMargin} ${SPACING.maxWidthNarrow} leading-relaxed`}
            >
              {texts.club.library.subtitle}
            </p>

            <div className={`${SPACING.maxWidthContent} ${SPACING.headingMargin}`}>
              <p className={`text-xl ${SPACING.paragraphMargin} text-center text-muted-foreground`}>
                {texts.club.library.description}
              </p>
              <div className={`grid grid-cols-2 md:grid-cols-4 ${SPACING.smallGap}`}>
                {texts.club.library.gameTypes.map((type) => (
                  <Card key={type} className="text-center">
                    <CardContent className={SPACING.smallGap}>
                      <p className="text-xl font-medium">{type}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className={SPACING.maxWidthContent}>
              <CardContent className={SPACING.cardPadding}>
                <h3 className={`font-semibold text-3xl ${SPACING.smallMargin} text-center font-display`}>
                  {texts.club.library.exploreTitle}
                </h3>
                <div className="text-center py-8">
                  <p className={`text-xl text-muted-foreground ${SPACING.smallMargin}`}>
                    {texts.club.library.exploreNote}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className={`${SPACING.maxWidthForm} text-center mt-12`}>
              <h3 className={`text-4xl font-bold ${SPACING.smallMargin} text-balance font-display`}>
                {texts.club.library.moreGames.title}
              </h3>
              <p className={`text-xl text-muted-foreground ${SPACING.paragraphMargin} leading-relaxed`}>
                {texts.club.library.moreGames.description}
              </p>
              <Button size="lg" asChild className="font-display">
                <a href="https://chat.whatsapp.com" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {texts.common.whatsappGroup}
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`${SPACING.section} bg-muted/50`}>
          <div className={`${SPACING.container} text-center`}>
            <h2
              className={`text-5xl md:text-6xl font-bold ${SPACING.smallMargin} text-center text-balance font-display`}
            >
              {texts.club.cta.title}
            </h2>
            <p className={`text-xl text-muted-foreground ${SPACING.subheadingMargin}`}>{texts.club.cta.subtitle}</p>
            <Button size="lg" asChild className="font-display">
              <Link href="/socio">{texts.club.cta.button}</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
