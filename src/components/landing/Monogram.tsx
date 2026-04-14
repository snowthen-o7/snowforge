import type { LucideIcon } from 'lucide-react'

type MonogramProps = {
  /** Lucide icon to render inside the tile. Takes precedence over letter. */
  icon?: LucideIcon
  /** Fallback letter when no icon is provided. */
  letter?: string
  /** Flat background color. Ignored when warmthGradient is true. */
  color?: string
  size?: number
  /** Use the warmth gradient instead of a flat color background. */
  warmthGradient?: boolean
  className?: string
}

export function Monogram({
  icon: Icon,
  letter,
  color,
  size = 48,
  warmthGradient = false,
  className = '',
}: MonogramProps) {
  const background = warmthGradient
    ? 'linear-gradient(135deg, rgb(var(--warmth-start)), rgb(var(--warmth-end)))'
    : color

  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center rounded-xl text-white font-display font-medium leading-none select-none ${className}`}
      style={{
        background,
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
      }}
    >
      {Icon ? <Icon size={Math.round(size * 0.55)} strokeWidth={2} /> : letter}
    </div>
  )
}
