import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Red ring + border when truthy. */
  error?: boolean
}

const inputBase =
  'block w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50'

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        inputBase,
        error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-brand',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
