import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies success variant classes', () => {
    render(<Badge variant="success">Live</Badge>)
    expect(screen.getByText('Live')).toHaveClass('text-emerald-400')
  })

  it('applies destructive variant classes', () => {
    render(<Badge variant="destructive">Banned</Badge>)
    expect(screen.getByText('Banned')).toHaveClass('text-red-400')
  })

  it('applies rose variant classes (refunded)', () => {
    render(<Badge variant="rose">Refunded</Badge>)
    expect(screen.getByText('Refunded')).toHaveClass('text-rose-400')
  })
})
