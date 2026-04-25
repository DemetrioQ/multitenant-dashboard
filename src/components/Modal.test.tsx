import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders with role=dialog and aria-modal=true', () => {
    render(
      <Modal title="Edit" onClose={() => {}}>
        <p>Body</p>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
  })

  it('exposes accessible title via aria-labelledby', () => {
    render(
      <Modal title="Edit profile" onClose={() => {}}>
        <p>Body</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Edit profile' })).toBeInTheDocument()
  })

  it('calls onClose when ESC is pressed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal title="x" onClose={onClose}>
        <input placeholder="field" />
      </Modal>,
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('focuses the first focusable element on mount', () => {
    render(
      <Modal title="x" onClose={() => {}}>
        <input placeholder="first" />
        <input placeholder="second" />
      </Modal>,
    )
    // First focusable is the close button (X), then the inputs.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }))
  })
})
