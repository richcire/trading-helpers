import type { ReactNode } from 'react'

import type { SurfaceLevel, Tone } from '../../types'
import { CalculationTooltipProvider } from './CalculationTooltip'
import { SectionCard } from './SectionCard'

interface Props {
  title: string
  children: ReactNode
  className?: string
  tone?: Tone
  surface?: SurfaceLevel
  actions?: ReactNode
  stagger?: number
}

export function ResultCard({
  actions,
  children,
  className,
  surface = 'raised',
  stagger,
  title,
  tone = 'accent',
}: Props) {
  return (
    <SectionCard actions={actions} className={className} stagger={stagger} surface={surface} title={title} tone={tone}>
      <CalculationTooltipProvider>{children}</CalculationTooltipProvider>
    </SectionCard>
  )
}
