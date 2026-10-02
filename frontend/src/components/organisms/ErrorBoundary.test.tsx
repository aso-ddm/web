import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Rompe(): never {
  throw new Error('chunk no encontrado')
}

it('muestra el aviso con botón de recargar en vez de pantalla en blanco', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<ErrorBoundary><Rompe /></ErrorBoundary>)
  expect(screen.getByText('Algo ha fallado')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Recargar' })).toBeTruthy()
})
