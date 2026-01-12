import { DragonIcon, DragonTextLogo } from '@/components/atoms/icons'
import { SocialLink } from '@/components/molecules/SocialLink'
import { SPACING } from '@/lib/constants'
import texts from '@/data/texts.json'

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-background">
      <div className={`${SPACING.container} ${SPACING.padYLg}`}>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${SPACING.gapLg}`}>
          <div className="text-center">
            <div className={`flex items-center justify-center ${SPACING.gapSm} ${SPACING.marginBottomXs}`}>
              <DragonIcon className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 brightness-0 invert" />
              <DragonTextLogo className="h-6 sm:h-7 md:h-8 brightness-0 invert" />
            </div>
            <p className={`text-sm sm:text-base md:text-lg leading-relaxed text-background ${SPACING.padXSm}`}>
              {texts.common.clubNameTagline}
            </p>
            <p className={`text-sm sm:text-base md:text-lg ${SPACING.marginTopSm} leading-relaxed text-background ${SPACING.padXSm}`}>
              {texts.common.address.street} {texts.common.address.city}
            </p>
          </div>

          <div className="text-center">
            <h4 className={`text-lg sm:text-xl md:text-2xl font-semibold font-display ${SPACING.marginBottomSm}`}>
              {texts.footer.follow}
            </h4>
            <div className={`flex ${SPACING.gapSm} justify-center`}>
              <SocialLink platform="instagram" />
              <SocialLink platform="twitter" />
              <SocialLink platform="facebook" />
              <SocialLink platform="whatsapp" />
            </div>
          </div>
        </div>

        <div className={`${SPACING.marginTopMd} ${SPACING.padYMd} border-t border-border text-center text-sm sm:text-base md:text-lg text-muted-foreground ${SPACING.padXSm}`}>
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
