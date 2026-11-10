import { it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EmbedTerceros } from './EmbedTerceros'

it('el contenido de terceros no se carga hasta aceptar las cookies, y la decisión se recuerda', () => {
  localStorage.clear()
  const pintar = () => render(
    <MemoryRouter><EmbedTerceros servicio="El mapa" enlace="https://maps.google.com"><iframe title="mapa" /></EmbedTerceros></MemoryRouter>,
  )
  const { unmount } = pintar()
  expect(screen.queryByTitle('mapa')).toBeNull()

  fireEvent.click(screen.getByText('Aceptar y mostrar'))
  expect(screen.getByTitle('mapa')).toBeTruthy()

  unmount()
  pintar()
  expect(screen.getByTitle('mapa')).toBeTruthy()
  localStorage.clear()
})
