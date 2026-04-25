import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })

  it('lets later Tailwind classes win on conflict', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-white', 'text-gray-400')).toBe('text-gray-400')
  })

  it('preserves non-conflicting classes', () => {
    expect(cn('px-2 py-1', 'rounded')).toBe('px-2 py-1 rounded')
  })
})
