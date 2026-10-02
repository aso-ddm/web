import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { Header } from './Header'

vi.mock('@/lib/scroll', () => ({ scrollToTop: vi.fn(), scrollToElement: vi.fn() }))

it('menú móvil: tiene nombre accesible y se cierra al pulsar un enlace de la misma página', () => {
  render(<MemoryRouter initialEntries={['/']}><Header /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
  const menu = screen.getByRole('dialog', { name: 'Menú' })

  const calendario = [...menu.querySelectorAll('a')].find((a) => a.getAttribute('href')?.includes('#'))!
  fireEvent.click(calendario)

  expect(screen.queryByRole('dialog', { name: 'Menú' })).toBeNull()
})
