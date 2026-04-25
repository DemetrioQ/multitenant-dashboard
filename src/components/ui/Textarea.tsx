import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'block w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 resize-y',
        error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-brand',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'
