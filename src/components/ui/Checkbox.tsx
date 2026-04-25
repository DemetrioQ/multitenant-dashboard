import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'w-4 h-4 rounded border-gray-600 bg-gray-800 text-brand focus:ring-brand focus:ring-offset-gray-900',
        className,
      )}
      {...props}
    />
  ),
)
Checkbox.displayName = 'Checkbox'
