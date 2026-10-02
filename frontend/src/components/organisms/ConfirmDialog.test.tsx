import { render, screen, fireEvent } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

it('confirmar no cierra el diálogo; mientras está pendiente no se puede repetir ni cancelar', () => {
  const onConfirm = vi.fn()
  const onOpenChange = vi.fn()
  const props = { open: true, onOpenChange, title: '¿Eliminar?', confirmLabel: 'Eliminar', onConfirm }
  const { rerender } = render(<ConfirmDialog {...props} />)

  fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
  expect(onConfirm).toHaveBeenCalledTimes(1)
  expect(onOpenChange).not.toHaveBeenCalled()

  rerender(<ConfirmDialog {...props} pending />)
  expect(screen.getAllByRole('button').every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
  fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' })
  expect(onOpenChange).not.toHaveBeenCalled()
})
