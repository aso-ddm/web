import { DragonIcon, DragonTextLogo } from '@/components/atoms/icons'
import { SocialLink } from '@/components/molecules/SocialLink'
import { SPACING } from '@/lib/constants'
import texts from '@/data/texts.json'

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-background">
      <div className={`${SPACING.container} py-8 sm:py-10 md:py-12`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <DragonIcon className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 brightness-0 invert" />
              <DragonTextLogo className="h-6 sm:h-7 md:h-8 brightness-0 invert" />
            </div>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-background px-4">
              {texts.common.clubNameTagline}
            </p>
            <p className="text-sm sm:text-base md:text-lg mt-3 sm:mt-4 leading-relaxed text-background px-4">
              {texts.common.address.street} {texts.common.address.city}
            </p>
          </div>

          <div className="text-center">
            <h4 className="text-lg sm:text-xl md:text-2xl font-semibold font-display mb-4 sm:mb-5 md:mb-6">
              {texts.footer.follow}
            </h4>
            <div className="flex gap-3 sm:gap-4 justify-center">
              <SocialLink platform="instagram" />
              <SocialLink platform="twitter" />
              <SocialLink platform="facebook" />
              <SocialLink platform="whatsapp" />
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border text-center text-sm sm:text-base md:text-lg text-muted-foreground px-4">
          <p className="text-background">
            &copy; {new Date().getFullYear()}{' '}
            <span style={{ fontFamily: 'var(--font-frank)' }}>{texts.common.clubName}</span>.{' '}
            {texts.common.copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}
