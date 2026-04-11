'use client'

import { useState } from 'react'

type CopyEmailButtonProps = {
  email: string
}

export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={`mailto:${email}`}
        className="text-foreground underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
      >
        {email}
      </a>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? 'Copied to clipboard' : `Copy ${email} to clipboard`}
        className="inline-flex h-5 w-5 items-center justify-center rounded text-ink-dim hover:text-foreground transition-colors"
      >
        {copied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </span>
  )
}
