import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  label: string
}

export function IconButton({ children, className, label, type = 'button', ...props }: Props) {
  return (
    <button
      aria-label={label}
      className={clsx(
        'inline-flex size-11 cursor-pointer items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--color-border-subtle)] bg-white/4 text-[color:var(--color-text-secondary)] transition duration-200 ease-out hover:border-[color:var(--color-border-strong)] hover:bg-white/8 hover:text-[color:var(--color-text-primary)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
