import clsx from 'clsx'
import type { ReactNode } from 'react'

import { useI18n } from '../../i18n'
import type { CalculationTooltipPayload, Tone } from '../../types'
import { CalculationTooltipPanel } from './CalculationTooltip'
import { useCalculationTooltipController } from './useCalculationTooltipController'

interface Props {
  label: string
  value: ReactNode
  hint?: string
  tone?: Tone
  className?: string
  tooltip?: CalculationTooltipPayload
}

const toneClasses: Record<Tone, string> = {
  neutral: 'text-[color:var(--color-text-primary)]',
  accent: 'text-[color:var(--color-accent)]',
  profit: 'text-[color:var(--color-profit)]',
  loss: 'text-[color:var(--color-loss)]',
  warning: 'text-[color:var(--color-warning)]',
}

export function MetricRow({ className, hint, label, tone = 'neutral', tooltip, value }: Props) {
  const { t } = useI18n()
  const { close, isOpen, open, panelId, rootRef, toggle } = useCalculationTooltipController()

  return (
    <div
      className={clsx('flex items-center justify-between gap-4 border-b border-white/6 py-3 last:border-b-0 last:pb-0 first:pt-0', className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          close()
        }
      }}
      onFocus={tooltip ? open : undefined}
      onMouseEnter={tooltip ? open : undefined}
      onMouseLeave={tooltip ? close : undefined}
      ref={tooltip ? rootRef : undefined}
    >
      <div className="relative">
        <div className="inline-flex items-center gap-2">
          <p className="text-sm text-[color:var(--color-text-secondary)]">{label}</p>
          {tooltip && (
            <button
              aria-describedby={isOpen ? panelId : undefined}
              aria-expanded={isOpen}
              aria-label={t('tooltip.view', { label })}
              className="inline-flex size-5 cursor-pointer items-center justify-center rounded-full border border-[color:var(--color-border-subtle)] bg-white/6 text-[11px] font-semibold text-[color:var(--color-text-secondary)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-primary)] focus-visible:outline-none"
              onClick={(event) => {
                event.preventDefault()
                toggle()
              }}
              type="button"
            >
              i
            </button>
          )}
        </div>
        {hint && <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">{hint}</p>}
        {tooltip && isOpen && (
          <div className="absolute left-0 top-full z-30" id={panelId}>
            <CalculationTooltipPanel align="left" tone={tooltip.tone ?? tone} tooltip={tooltip} />
          </div>
        )}
      </div>
      <div aria-describedby={tooltip && isOpen ? panelId : undefined} className={clsx('text-right text-sm font-semibold text-data tracking-[-0.02em]', toneClasses[tone])}>
        {value}
      </div>
    </div>
  )
}
