"use client"

import type React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Instagram, Twitter, Facebook } from "lucide-react"
import { useState } from "react"
import texts from "@/texts.json"
import { SPACING } from "@/lib/constants"

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className={`${SPACING.sectionHero} bg-gradient-to-b from-muted/50 to-background`}>
          <div className={`${SPACING.container} text-center`}>
            <h1
              className={`text-6xl md:text-7xl lg:text-8xl font-bold ${SPACING.paragraphMargin} text-balance font-display`}
            >
              {texts.contact.hero.title}
            </h1>
            <p className={`text-3xl text-muted-foreground ${SPACING.maxWidthForm}`}>{texts.contact.hero.subtitle}</p>
          </div>
        </section>

        {/* Social Media */}
        <section className={SPACING.section}>
          <div className={SPACING.container}>
            <div className={SPACING.maxWidthContent}>
              <h2 className={`text-5xl font-bold ${SPACING.subheadingMargin} text-center text-balance font-display`}>
                {texts.contact.social.title}
              </h2>

              <div className={`grid md:grid-cols-2 lg:grid-cols-4 ${SPACING.smallGap} ${SPACING.headingMargin}`}>
                {texts.contact.social.platforms.map((social) => {
                  const iconMap: Record<string, any> = {
                    Instagram,
                    Twitter,
                    Facebook,
                    MessageCircle,
                  }
                  const Icon = iconMap[social.icon] || MessageCircle
                  return (
                    <Button
                      key={social.name}
                      variant="outline"
                      size="lg"
                      className="h-auto py-6 bg-transparent text-xl font-display"
                      asChild
                    >
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <Icon className="mr-2 h-6 w-6" />
                        {social.name}
                      </a>
                    </Button>
                  )
                })}
              </div>

              {/* WhatsApp Section */}
              <Card className={`bg-primary text-primary-foreground ${SPACING.headingMargin}`}>
                <CardContent className={`${SPACING.cardPaddingLarge} text-center`}>
                  <h3 className={`text-4xl font-bold ${SPACING.smallMargin} font-display`}>
                    {texts.contact.whatsapp.title}
                  </h3>
                  <p className={`text-xl ${SPACING.paragraphMargin} opacity-90`}>{texts.contact.whatsapp.subtitle}</p>
                  <div className={`flex flex-col sm:flex-row ${SPACING.smallGap} items-center justify-center`}>
                    <Button size="lg" variant="secondary" asChild className="font-display">
                      <a href="https://chat.whatsapp.com" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-5 w-5" />
                        {texts.common.whatsappCTA}
                      </a>
                    </Button>
                    <div className="bg-primary-foreground p-4 rounded-lg">
                      <div className="w-32 h-32 bg-muted/20 flex items-center justify-center text-xs text-primary">
                        {texts.contact.whatsapp.qrCode}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className={`${SPACING.section} bg-muted/50`}>
          <div className={SPACING.container}>
            <div className={SPACING.maxWidthForm}>
              <h2 className={`text-5xl font-bold ${SPACING.subheadingMargin} text-center text-balance font-display`}>
                {texts.contact.form.title}
              </h2>

              <Card>
                <CardContent className={SPACING.cardPaddingLarge}>
                  <form onSubmit={handleSubmit} className={SPACING.itemsGap}>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xl">
                        {texts.contact.form.nameLabel}
                      </Label>
                      <Input
                        id="name"
                        className="text-xl"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xl">
                        {texts.contact.form.emailLabel}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        className="text-xl"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-xl">
                        {texts.contact.form.messageLabel}
                      </Label>
                      <Textarea
                        id="message"
                        rows={6}
                        className="text-xl"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full text-xl font-display">
                      {texts.contact.form.submitButton}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Address */}
        <section className={SPACING.section}>
          <div className={SPACING.container}>
            <div className={SPACING.maxWidthContent}>
              <h2 className={`text-5xl font-bold ${SPACING.subheadingMargin} text-center text-balance font-display`}>
                {texts.contact.address.title}
              </h2>

              <Card>
                <CardContent className="p-0">
                  <div className="aspect-[16/9] bg-muted rounded-t-lg overflow-hidden">
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
                  <div className={`${SPACING.cardPaddingLarge} text-center`}>
                    <h3 className={`text-3xl font-bold ${SPACING.smallMargin} font-display`}>
                      {texts.common.clubName}
                    </h3>
                    <p className="text-2xl">{texts.common.address.street}</p>
                    <p className="text-xl text-muted-foreground">{texts.common.address.city}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
