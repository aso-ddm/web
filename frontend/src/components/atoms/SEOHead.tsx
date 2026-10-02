import { useEffect } from 'react'

interface SEOHeadProps {
  title?: string
  description?: string
  path?: string
  noindex?: boolean
}

const SITE_NAME = 'Dragón de Madera'
const BASE_URL = 'https://dragondemadera.com'
const DEFAULT_DESCRIPTION = 'Tu club de juegos de mesa en Granada. Descubre, juega y conoce gente con tu misma afición. Más de 800 juegos, partidas semanales y un ambiente familiar.'

/** Actualiza <tag key="id"> de <head> (lo crea si no existe); value null lo quita */
function setHead(tag: 'meta' | 'link', key: 'name' | 'property' | 'rel', id: string, attr: 'content' | 'href', value: string | null) {
  let el = document.head.querySelector(`${tag}[${key}="${id}"]`)
  if (value === null) { el?.remove(); return }
  if (!el) {
    el = document.createElement(tag)
    el.setAttribute(key, id)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

const meta = (key: 'name' | 'property', id: string, value: string | null) => setHead('meta', key, id, 'content', value)

/** Las etiquetas por defecto viven en index.html (las leen las vistas previas de WhatsApp/Telegram, que no
 *  ejecutan JS); aquí se actualizan por página en vez de añadir duplicados, que confundían a Google. */
export function SEOHead({ title, description = DEFAULT_DESCRIPTION, path = '/', noindex = false }: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Club de Juegos de Mesa en Granada`
  const url = `${BASE_URL}${path}`

  useEffect(() => {
    document.title = fullTitle
    meta('name', 'description', description)
    meta('name', 'robots', noindex ? 'noindex, nofollow' : null)
    meta('property', 'og:title', fullTitle)
    meta('property', 'og:description', description)
    meta('property', 'og:url', url)
    meta('name', 'twitter:title', fullTitle)
    meta('name', 'twitter:description', description)
    setHead('link', 'rel', 'canonical', 'href', url)
  }, [fullTitle, description, url, noindex])

  return null
}
