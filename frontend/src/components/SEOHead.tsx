import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  title?: string
  description?: string
  path?: string
  noindex?: boolean
}

const SITE_NAME = 'Dragón de Madera'
const BASE_URL = 'https://dragondemadera.com'
const DEFAULT_DESCRIPTION = 'Tu club de juegos de mesa en Granada. Descubre, juega y conoce gente con tu misma afición. Más de 800 juegos, partidas semanales y un ambiente familiar.'
const OG_IMAGE = `${BASE_URL}/club-community-people-playing.jpg`

export function SEOHead({ title, description = DEFAULT_DESCRIPTION, path = '/', noindex = false }: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Club de Juegos de Mesa en Granada`
  const url = `${BASE_URL}${path}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  )
}
