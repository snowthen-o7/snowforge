'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

function notify() {
  listeners.forEach((cb) => cb())
}

function getSnapshot(): Theme {
  const saved = localStorage.getItem('theme') as Theme | null
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// On the server we can't read localStorage or media queries, so render nothing
// until hydration resolves the real value. Returning null here is paired with
// the early return below.
function getServerSnapshot(): Theme | null {
  return null
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (theme === null) return
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(() => {
    if (theme === null) return
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    notify()
  }, [theme])

  if (theme === null) {
    return null
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-lg bg-surface border border-border hover:border-border-hover transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}
