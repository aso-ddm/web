import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { RichTextContent } from './RichTextContent'

it('los enlaces abren en pestaña nueva y los javascript: se eliminan', () => {
  const { container } = render(
    <RichTextContent html={'<p><a href="/rgpd">RGPD</a> <a href="javascript:alert(1)">x</a></p>'} />,
  )
  const [rgpd, malo] = container.querySelectorAll('a')
  expect(rgpd.getAttribute('target')).toBe('_blank')
  expect(rgpd.getAttribute('rel')).toBe('noopener noreferrer')
  expect(malo.getAttribute('href')).toBeNull()
})
