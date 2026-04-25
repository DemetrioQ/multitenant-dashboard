import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'block w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50',
        error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-brand',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'
