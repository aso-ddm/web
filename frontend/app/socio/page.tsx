import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, MessageCircle, Key, Trophy, Users, Tag } from "lucide-react"
import texts from "@/texts.json"
import { SPACING } from "@/lib/constants"

export default function SocioPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className={`${SPACING.sectionHero} bg-gradient-to-b from-muted/50 to-background`}>
          <div className={SPACING.container}>
            <div className={`${SPACING.maxWidthContent} text-center ${SPACING.itemsGap}`}>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-balance leading-tight font-display">
                {texts.member.hero.title}
              </h1>
              <p className="text-3xl text-muted-foreground leading-relaxed text-pretty">{texts.member.hero.subtitle}</p>
            </div>
          </div>
        </section>

        {/* How to Join */}
        <section className={SPACING.section}>
          <div className={SPACING.container}>
            <div className={SPACING.maxWidthContent}>
              <h2
                className={`text-5xl md:text-6xl font-bold ${SPACING.headingMargin} text-center text-balance font-display`}
              >
                {texts.member.howToJoin.title}
              </h2>

              <div className="space-y-8">
                {texts.member.howToJoin.steps.map((step, index) => (
                  <Card key={index} className={index === 2 ? "bg-primary text-primary-foreground" : ""}>
                    <CardContent className={SPACING.cardPaddingLarge}>
                      <div className={`flex ${SPACING.itemsGap} items-start`}>
                        <div
                          className={`flex-shrink-0 w-16 h-16 rounded-full ${index === 2 ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"} flex items-center justify-center font-bold text-3xl font-display`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h3 className={`text-3xl font-semibold ${SPACING.smallMargin} font-display`}>{step.title}</h3>
                          <p className={`text-xl ${index === 2 ? "" : "text-muted-foreground"} leading-relaxed`}>
                            {step.description}
                          </p>
                          {step.items && (
                            <>
                              <ul className={`space-y-2 mt-4`}>
                                {step.items.map((item, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <CheckCircle className="h-7 w-7 shrink-0" />
                                    <span className="text-xl">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className={`${SPACING.section} bg-muted/50`}>
          <div className={SPACING.container}>
            <h2
              className={`text-5xl md:text-6xl font-bold ${SPACING.headingMargin} text-center text-balance font-display`}
            >
              {texts.member.benefits.title}
            </h2>

            <div className={`grid md:grid-cols-2 lg:grid-cols-3 ${SPACING.itemsGap} ${SPACING.maxWidthWide}`}>
              {texts.member.benefits.items.map((benefit, i) => {
                const iconMap: Record<string, any> = {
                  "Uso regular": Users,
                  "Telegram de socios": MessageCircle,
                  "Voz y voto": CheckCircle,
                  "Llaves a los 6 meses": Key,
                  Descuentos: Tag,
                  "Eventos exclusivos": Trophy,
                }
                const Icon = iconMap[benefit.title] || CheckCircle
                return (
                  <Card key={i}>
                    <CardContent className={`${SPACING.cardPadding} text-center`}>
                      <Icon className="h-16 w-16 text-primary mx-auto mb-4" />
                      <h3 className={`font-semibold text-2xl ${SPACING.smallMargin} font-display`}>{benefit.title}</h3>
                      <p className="text-xl text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={SPACING.section}>
          <div className={`${SPACING.container} text-center`}>
            <h2 className={`text-5xl md:text-6xl font-bold ${SPACING.smallMargin} text-balance font-display`}>
              {texts.member.cta.title}
            </h2>
            <p
              className={`text-xl text-muted-foreground ${SPACING.subheadingMargin} ${SPACING.maxWidthForm} leading-relaxed`}
            >
              {texts.member.cta.subtitle}
            </p>
            <Button size="lg" asChild className="font-display">
              <a href="https://chat.whatsapp.com" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                {texts.common.whatsappGroup}
              </a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
