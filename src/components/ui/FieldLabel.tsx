import clsx from 'clsx'

import type { FieldState } from '../../types'

interface Props {
  htmlFor?: string
  children: string
  state?: FieldState
}

const stateClasses: Record<FieldState, string> = {
  default: 'text-[color:var(--color-text-secondary)]',
  error: 'text-[color:var(--color-loss)]',
  disabled: 'text-[color:var(--color-text-muted)]',
}

export function FieldLabel({ children, htmlFor, state = 'default' }: Props) {
  return (
    <label
      className={clsx('block text-xs font-medium uppercase tracking-[0.14em]', stateClasses[state])}
      htmlFor={htmlFor}
    >
      {children}
    </label>
  )
}
