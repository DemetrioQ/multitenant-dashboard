import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-gray-800 text-gray-400 border-gray-700',
        brand: 'bg-brand/15 text-brand border-brand/30',
        info: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
        success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        destructive: 'bg-red-500/10 text-red-400 border-red-500/20',
        rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        muted: 'bg-gray-800 text-gray-500 border-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
