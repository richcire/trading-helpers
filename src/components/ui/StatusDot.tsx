import clsx from 'clsx'

import type { Tone } from '../../types'

interface Props {
  tone?: Tone
  label?: string
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-[color:var(--color-text-muted)]',
  accent: 'bg-[color:var(--color-accent)]',
  profit: 'bg-[color:var(--color-profit)]',
  loss: 'bg-[color:var(--color-loss)]',
  warning: 'bg-[color:var(--color-warning)]',
}

export function StatusDot({ label, tone = 'neutral' }: Props) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={clsx('size-2.5 rounded-full shadow-[0_0_18px_currentColor]', toneClasses[tone])} />
      {label && <span className="text-xs font-medium text-[color:var(--color-text-secondary)]">{label}</span>}
    </span>
  )
}
