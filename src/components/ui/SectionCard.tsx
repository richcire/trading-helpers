import clsx from 'clsx'
import type { ReactNode } from 'react'

import { useInitialLoad } from '../../App'
import type { SurfaceLevel, Tone } from '../../types'

interface Props {
  title?: string
  eyebrow?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  tone?: Tone
  surface?: SurfaceLevel
  className?: string
  stagger?: number
}

const toneClasses: Record<Tone, string> = {
  neutral: '',
  accent: 'ring-1 ring-[color:var(--color-accent-soft)]',
  profit: 'ring-1 ring-[rgba(62,213,152,0.16)]',
  loss: 'ring-1 ring-[rgba(255,107,122,0.16)]',
  warning: 'ring-1 ring-[rgba(246,199,96,0.16)]',
}

const surfaceClasses: Record<SurfaceLevel, string> = {
  base: 'panel-surface',
  raised: 'panel-elevated',
  overlay: 'panel-elevated bg-[rgba(18,35,44,0.95)] backdrop-blur-xl',
}

export function SectionCard({
  actions,
  children,
  className,
  description,
  eyebrow,
  stagger,
  surface = 'base',
  title,
  tone = 'neutral',
}: Props) {
  const isInitialLoad = useInitialLoad()
  const shouldAnimate = isInitialLoad && typeof stagger === 'number'

  return (
    <section
      className={clsx(
        'rounded-[var(--radius-panel)] p-4 sm:p-6',
        surfaceClasses[surface],
        toneClasses[tone],
        shouldAnimate && 'animate-card-in',
        className,
      )}
      style={shouldAnimate ? { '--stagger': `${stagger}ms` } as React.CSSProperties : undefined}
    >
      {(eyebrow || title || description || actions) && (
        <div className="mb-4 sm:mb-5 flex items-start justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--color-text-primary)]">{title}</h2>}
            {description && <p className="max-w-2xl text-sm text-[color:var(--color-text-secondary)]">{description}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
