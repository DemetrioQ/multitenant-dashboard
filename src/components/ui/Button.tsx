import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
  {
    variants: {
      variant: {
        primary: 'bg-brand hover:bg-brand-hover text-white',
        secondary: 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200',
        ghost: 'text-gray-400 hover:text-white hover:bg-gray-800',
        destructive: 'bg-red-600 hover:bg-red-500 text-white',
        outline: 'border border-gray-700 text-gray-200 hover:bg-gray-800',
      },
      size: {
        sm: 'text-xs px-3 py-1.5',
        md: 'text-sm px-4 py-2',
        lg: 'text-sm px-5 py-2.5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
