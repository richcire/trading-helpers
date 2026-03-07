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
}

export function ResultCard({
  actions,
  children,
  className,
  surface = 'base',
  title,
  tone = 'neutral',
}: Props) {
  return (
    <SectionCard actions={actions} className={className} surface={surface} title={title} tone={tone}>
      <CalculationTooltipProvider>{children}</CalculationTooltipProvider>
    </SectionCard>
  )
}
