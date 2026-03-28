import clsx from 'clsx'

import type { Tone } from '../../types'

interface SegmentedControlOption<T extends string> {
  label: string
  value: T
  hint?: string
}

interface Props<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedControlOption<T>[]
  tone?: Tone
  className?: string
}

const activeToneClasses: Record<Tone, string> = {
  neutral: 'bg-white/10 text-[color:var(--color-text-primary)]',
  accent: 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]',
  profit: 'bg-[rgba(62,213,152,0.14)] text-[color:var(--color-profit)]',
  loss: 'bg-[rgba(255,107,122,0.14)] text-[color:var(--color-loss)]',
  warning: 'bg-[rgba(246,199,96,0.14)] text-[color:var(--color-warning)]',
}

export function SegmentedControl<T extends string>({
  className,
  onChange,
  options,
  tone = 'accent',
  value,
}: Props<T>) {
  const gridColsClass =
    options.length === 3
      ? 'grid-cols-3'
      : options.length === 4
        ? 'grid-cols-4'
        : 'grid-cols-2'

  return (
    <div className={clsx('grid min-h-10 sm:min-h-11 gap-1 sm:gap-2 rounded-[var(--radius-control)] border border-[color:var(--color-border-subtle)] bg-black/10 p-1', gridColsClass, className)}>
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            className={clsx(
              'cursor-pointer rounded-[calc(var(--radius-control)-6px)] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold tracking-[-0.01em] transition duration-200 ease-out focus-visible:outline-none',
              isActive
                ? activeToneClasses[tone]
                : 'text-[color:var(--color-text-muted)] hover:bg-white/6 hover:text-[color:var(--color-text-primary)]',
            )}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <span>{option.label}</span>
            {option.hint && <span className="ml-2 text-xs font-medium opacity-70">{option.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}
