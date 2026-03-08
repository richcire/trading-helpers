import clsx from 'clsx'
import { useMemo, useState, type ReactNode } from 'react'

import { useI18n } from '../../i18n'
import type { CalculationTooltipPayload, Tone } from '../../types'
import { TooltipGroupContext, useCalculationTooltipController } from './useCalculationTooltipController'

const toneClasses: Record<Tone, string> = {
  neutral: 'text-[color:var(--color-text-primary)]',
  accent: 'text-[color:var(--color-accent)]',
  profit: 'text-[color:var(--color-profit)]',
  loss: 'text-[color:var(--color-loss)]',
  warning: 'text-[color:var(--color-warning)]',
}

export function CalculationTooltipProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const contextValue = useMemo(() => ({ openId, setOpenId }), [openId])

  return <TooltipGroupContext.Provider value={contextValue}>{children}</TooltipGroupContext.Provider>
}

interface TooltipPanelProps {
  tooltip: CalculationTooltipPayload
  tone?: Tone
  align?: 'left' | 'right'
}

export function CalculationTooltipPanel({ align = 'right', tone = 'neutral', tooltip }: TooltipPanelProps) {
  const { t } = useI18n()

  return (
    <div
      className={clsx(
        'pointer-events-none absolute z-30 mt-2 w-[min(90vw,22rem)] rounded-[var(--radius-control)] border border-[color:var(--color-border-strong)] panel-elevated p-3 text-left shadow-[var(--shadow-modal)]',
        align === 'right' ? 'right-0 top-full' : 'left-0 top-full',
      )}
      role="tooltip"
    >
      <p className={clsx('text-xs font-semibold uppercase tracking-[0.12em]', toneClasses[tone])}>{tooltip.title}</p>
      <div className="mt-2 space-y-1.5 text-xs leading-5 text-[color:var(--color-text-secondary)]">
        <p>
          <span className="mr-1 text-[color:var(--color-text-muted)]">{t('common.formula')}</span>
          <span className="text-data">{tooltip.formula}</span>
        </p>
        <p>
          <span className="mr-1 text-[color:var(--color-text-muted)]">{t('common.substitution')}</span>
          <span className="text-data">{tooltip.substitution}</span>
        </p>
        <p>
          <span className="mr-1 text-[color:var(--color-text-muted)]">{t('common.result')}</span>
          <span className={clsx('text-data font-semibold', toneClasses[tone])}>{tooltip.result}</span>
        </p>
      </div>
      {tooltip.note && <p className="mt-2 text-[11px] leading-4 text-[color:var(--color-text-muted)]">{tooltip.note}</p>}
    </div>
  )
}

interface ValueTooltipProps {
  tooltip: CalculationTooltipPayload
  tone?: Tone
  className?: string
  align?: 'left' | 'right'
  children: ReactNode
}

export function ValueWithTooltip({ align = 'right', children, className, tone = 'neutral', tooltip }: ValueTooltipProps) {
  const { close, isOpen, open, panelId, rootRef, toggle } = useCalculationTooltipController()
  const { t } = useI18n()

  return (
    <div
      className={clsx('relative inline-flex items-center gap-2', className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          close()
        }
      }}
      onFocus={open}
      onMouseEnter={open}
      onMouseLeave={close}
      ref={rootRef}
    >
      <div aria-describedby={isOpen ? panelId : undefined} className="text-data">
        {children}
      </div>
      <button
        aria-describedby={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        aria-label={t('tooltip.view', { label: tooltip.title })}
        className="inline-flex size-5 cursor-pointer items-center justify-center rounded-full border border-[color:var(--color-border-subtle)] bg-white/6 text-[11px] font-semibold text-[color:var(--color-text-secondary)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-primary)] focus-visible:outline-none"
        onClick={(event) => {
          event.preventDefault()
          toggle()
        }}
        type="button"
      >
        i
      </button>
      {isOpen && (
        <div id={panelId}>
          <CalculationTooltipPanel align={align} tone={tone} tooltip={tooltip} />
        </div>
      )}
    </div>
  )
}
