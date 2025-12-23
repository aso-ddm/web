import { Instagram, Twitter, Facebook } from "lucide-react"
import texts from "@/texts.json"
import { SPACING } from "@/lib/constants"
import { DragonIcon } from "./dragon-icon"


const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
)

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-background">
      <div className={`${SPACING.container} py-12`}>
        <div className={`grid grid-cols-2`}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <DragonIcon className="h-11 w-11 text-background" />
              <h3 className="text-2xl font-bold font-display text-background">{texts.common.clubName}</h3>
            </div>
            <p className="text-lg leading-relaxed text-background">{texts.common.clubNameTagline}</p>
            <p className="text-lg mt-4 leading-relaxed text-background">
              {texts.common.address.street} {texts.common.address.city}
            </p>
          </div>

          <div className="text-center">
            <h4 className="text-xl font-semibold font-display mb-0.5">{texts.footer.contact}</h4>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <p className="text-background mb-5">{texts.common.email}</p>
            </a>
            <h4 className="text-xl font-semibold font-display mb-0.5">{texts.footer.follow}</h4>
            <div className="flex gap-4 justify-center">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-6 w-6 text-background" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-6 w-6 text-background" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-6 w-6 text-background" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <WhatsAppIcon className="h-6 w-6 text-background" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-lg text-muted-foreground">
          <p className="text-background">
            &copy; {new Date().getFullYear()} {texts.common.clubName}. {texts.common.copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}
