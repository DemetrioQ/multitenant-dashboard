import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './Input'

describe('Input', () => {
  it('renders and accepts typing', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="email" />)
    const input = screen.getByPlaceholderText('email')
    await user.type(input, 'a@b.com')
    expect(input).toHaveValue('a@b.com')
  })

  it('shows red ring when error prop is true', () => {
    render(<Input placeholder="x" error />)
    expect(screen.getByPlaceholderText('x')).toHaveClass('border-red-500')
  })

  it('shows brand focus ring when error prop is false', () => {
    render(<Input placeholder="x" />)
    expect(screen.getByPlaceholderText('x')).toHaveClass('focus:ring-brand')
  })
})
