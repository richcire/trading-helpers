import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import type { Tone } from '../../types'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'solid' | 'ghost' | 'outline'
  tone?: Tone
}

const toneStyles: Record<Tone, string> = {
  neutral:
    'border-[color:var(--color-border-strong)] bg-white/4 text-[color:var(--color-text-primary)] hover:bg-white/8',
  accent:
    'border-transparent bg-[color:var(--color-accent)] text-slate-950 hover:brightness-110',
  profit:
    'border-transparent bg-[color:var(--color-profit)] text-slate-950 hover:brightness-110',
  loss:
    'border-transparent bg-[color:var(--color-loss)] text-slate-950 hover:brightness-110',
  warning:
    'border-transparent bg-[color:var(--color-warning)] text-slate-950 hover:brightness-110',
}

const ghostToneStyles: Record<Tone, string> = {
  neutral:
    'border-transparent bg-transparent text-[color:var(--color-text-secondary)] hover:bg-white/6 hover:text-[color:var(--color-text-primary)]',
  accent:
    'border-transparent bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)] hover:bg-[rgba(82,199,222,0.2)]',
  profit:
    'border-transparent bg-[rgba(62,213,152,0.12)] text-[color:var(--color-profit)] hover:bg-[rgba(62,213,152,0.18)]',
  loss:
    'border-transparent bg-[rgba(255,107,122,0.12)] text-[color:var(--color-loss)] hover:bg-[rgba(255,107,122,0.18)]',
  warning:
    'border-transparent bg-[rgba(246,199,96,0.12)] text-[color:var(--color-warning)] hover:bg-[rgba(246,199,96,0.18)]',
}

const outlineToneStyles: Record<Tone, string> = {
  neutral:
    'border-[color:var(--color-border-strong)] bg-transparent text-[color:var(--color-text-primary)] hover:border-white/30 hover:bg-white/4',
  accent:
    'border-[rgba(82,199,222,0.4)] bg-transparent text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)]',
  profit:
    'border-[rgba(62,213,152,0.4)] bg-transparent text-[color:var(--color-profit)] hover:bg-[rgba(62,213,152,0.08)]',
  loss:
    'border-[rgba(255,107,122,0.4)] bg-transparent text-[color:var(--color-loss)] hover:bg-[rgba(255,107,122,0.08)]',
  warning:
    'border-[rgba(246,199,96,0.4)] bg-transparent text-[color:var(--color-warning)] hover:bg-[rgba(246,199,96,0.08)]',
}

export function ActionButton({
  children,
  className,
  tone = 'neutral',
  type = 'button',
  variant = 'solid',
  ...props
}: Props) {
  const styles =
    variant === 'ghost'
      ? ghostToneStyles[tone]
      : variant === 'outline'
        ? outlineToneStyles[tone]
        : toneStyles[tone]

  return (
    <button
      className={clsx(
        'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] border px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] transition duration-200 ease-out focus-visible:outline-none disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/4 disabled:text-[color:var(--color-text-muted)]',
        styles,
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
