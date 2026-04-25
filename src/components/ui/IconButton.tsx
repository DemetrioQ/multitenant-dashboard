import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:opacity-40 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:
          'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800',
        ghost: 'text-gray-400 hover:text-white hover:bg-gray-800',
        destructive: 'text-gray-400 hover:text-red-400 hover:bg-red-500/10',
      },
      size: {
        sm: 'p-1.5',
        md: 'p-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof iconButtonVariants> {
  /** Required for accessibility — icon-only buttons need a text label for screen readers. */
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(iconButtonVariants({ variant, size }), className)} {...props} />
  ),
)
IconButton.displayName = 'IconButton'
