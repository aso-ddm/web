import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { SEOHead } from './SEOHead'

it('actualiza las etiquetas de index.html en vez de duplicarlas', () => {
  document.head.innerHTML = '<link rel="canonical" href="https://dragondemadera.com/"><meta property="og:title" content="Home">'
  const { rerender } = render(<SEOHead title="El club" path="/club" />)
  expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
  expect(document.head.querySelector('link[rel="canonical"]')!.getAttribute('href')).toBe('https://dragondemadera.com/club')
  expect(document.head.querySelectorAll('meta[property="og:title"]')).toHaveLength(1)
  expect(document.title).toBe('El club | Dragón de Madera')

  rerender(<SEOHead title="Acceder" path="/login" noindex />)
  expect(document.head.querySelector('meta[name="robots"]')!.getAttribute('content')).toBe('noindex, nofollow')
  rerender(<SEOHead path="/" />)
  expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
})
