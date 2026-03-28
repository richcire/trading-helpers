import clsx from 'clsx'
import type { ReactNode } from 'react'

import { useInitialLoad } from '../../App'
import type { SurfaceLevel, Tone } from '../../types'

interface Props {
  title?: string
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
  overlay: 'panel-elevated bg-[rgba(18,35,44,0.95)]',
}

export function SectionCard({
  actions,
  children,
  className,
  description,
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
        'rounded-[var(--radius-panel)] px-4 pb-4 pt-3.5 sm:px-6 sm:pb-6 sm:pt-5',
        surfaceClasses[surface],
        toneClasses[tone],
        shouldAnimate && 'animate-card-in',
        className,
      )}
      style={shouldAnimate ? { '--stagger': `${stagger}ms` } as React.CSSProperties : undefined}
    >
      {(title || description || actions) && (
        <div className="mb-3 sm:mb-4 space-y-1.5">
          {(title || actions) && (
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              {title && <h2 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--color-text-primary)]">{title}</h2>}
              {actions && <div className="shrink-0">{actions}</div>}
            </div>
          )}
          {description && <p className="max-w-2xl text-sm text-[color:var(--color-text-secondary)]">{description}</p>}
        </div>
      )}
      {children}
    </section>
  )
}
