'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** A header or footer link that marks the current section for assistive tech and the eye. */
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const current = pathname === href || pathname.startsWith(`${href}/`)
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={`inline-flex min-h-11 items-center px-1 transition-colors hover:text-foreground ${
        current ? 'text-foreground underline decoration-warmth-start decoration-2 underline-offset-4' : ''
      }`}
    >
      {children}
    </Link>
  )
}
