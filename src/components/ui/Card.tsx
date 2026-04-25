import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/** Raised surface — dark card with subtle border. Most common layout container. */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('bg-gray-900 border border-gray-800 rounded-xl', className)}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-800', className)}
      {...props}
    />
  ),
)
CardHeader.displayName = 'CardHeader'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 sm:p-6', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-800', className)}
      {...props}
    />
  ),
)
CardFooter.displayName = 'CardFooter'
