import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/** Animated placeholder block. Use for content shape during loading. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-gray-800', className)}
      {...props}
    />
  )
}
