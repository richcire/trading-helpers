import clsx from 'clsx'

import { formatPct, formatPnl } from '../../utils/format'

interface Props {
  value: number
  format?: 'amount' | 'pct'
  decimals?: number
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export function PnlBadge({
  decimals = 2,
  format = 'amount',
  showIcon = true,
  size = 'md',
  value,
}: Props) {
  const toneClass =
    value > 0
      ? 'border-[rgba(62,213,152,0.2)] bg-[rgba(62,213,152,0.12)] text-[color:var(--color-profit)]'
      : value < 0
        ? 'border-[rgba(255,107,122,0.2)] bg-[rgba(255,107,122,0.12)] text-[color:var(--color-loss)]'
        : 'border-white/10 bg-white/6 text-[color:var(--color-text-secondary)]'

  const label = format === 'pct' ? formatPct(value, decimals) : formatPnl(value, decimals)

  return (
    <span
      className={clsx(
        'text-data inline-flex items-center gap-2 rounded-[var(--radius-pill)] border font-semibold tracking-[-0.02em]',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        toneClass,
      )}
    >
      {showIcon && (
        <span
          className={clsx(
            'inline-block rounded-full',
            size === 'sm' ? 'size-1.5' : 'size-2',
            value > 0 ? 'bg-[color:var(--color-profit)]' : value < 0 ? 'bg-[color:var(--color-loss)]' : 'bg-[color:var(--color-text-muted)]',
          )}
        />
      )}
      {label}
    </span>
  )
}
