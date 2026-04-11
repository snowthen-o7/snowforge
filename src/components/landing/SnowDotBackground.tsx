type SnowDotBackgroundProps = {
  className?: string
}

/**
 * Absolutely-positioned layer that renders scattered snow-colored dots.
 * Uses CSS var --snow-dot-color which adapts to light/dark mode automatically.
 * Parent must be position: relative and overflow hidden if clipping is desired.
 */
export function SnowDotBackground({ className = '' }: SnowDotBackgroundProps) {
  const dotStops = [
    '12% 18%',
    '78% 28%',
    '34% 52%',
    '88% 68%',
    '22% 82%',
    '62% 88%',
    '50% 12%',
    '8% 60%',
    '92% 44%',
    '44% 32%',
  ]

  const backgroundImage = dotStops
    .map(
      (pos) =>
        `radial-gradient(circle at ${pos}, var(--snow-dot-color) 1px, transparent 1.5px)`
    )
    .join(', ')

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ backgroundImage }}
    />
  )
}
