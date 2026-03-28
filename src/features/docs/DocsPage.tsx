import { useMemo } from 'react'

import { SectionCard } from '../../components/ui/SectionCard'
import { useI18n } from '../../i18n'

interface GuideCard {
  title: string
  description: string
  bullets: string[]
}

export function DocsPage() {
  const { t } = useI18n()

  const quickStartSteps = useMemo(
    () => [
      t('docs.quick.step1'),
      t('docs.quick.step2'),
      t('docs.quick.step3'),
      t('docs.quick.step4'),
    ],
    [t],
  )

  const toolGuides = useMemo<GuideCard[]>(
    () => [
      {
        title: t('docs.tools.avg.title'),
        description: t('docs.tools.avg.description'),
        bullets: [
          t('docs.tools.avg.b1'),
          t('docs.tools.avg.b2'),
          t('docs.tools.avg.b3'),
        ],
      },
      {
        title: t('docs.tools.dca.title'),
        description: t('docs.tools.dca.description'),
        bullets: [
          t('docs.tools.dca.b1'),
          t('docs.tools.dca.b2'),
          t('docs.tools.dca.b3'),
        ],
      },
      {
        title: t('docs.tools.sizing.title'),
        description: t('docs.tools.sizing.description'),
        bullets: [
          t('docs.tools.sizing.b1'),
          t('docs.tools.sizing.b2'),
          t('docs.tools.sizing.b3'),
        ],
      },
      {
        title: t('docs.tools.sim.title'),
        description: t('docs.tools.sim.description'),
        bullets: [
          t('docs.tools.sim.b1'),
          t('docs.tools.sim.b2'),
          t('docs.tools.sim.b3'),
        ],
      },
      {
        title: t('docs.tools.exp.title'),
        description: t('docs.tools.exp.description'),
        bullets: [
          t('docs.tools.exp.b1'),
          t('docs.tools.exp.b2'),
          t('docs.tools.exp.b3'),
        ],
      },
    ],
    [t],
  )

  const interpretationTips = useMemo(
    () => [
      t('docs.interpret.t1'),
      t('docs.interpret.t2'),
      t('docs.interpret.t3'),
      t('docs.interpret.t4'),
    ],
    [t],
  )

  const commonMistakes = useMemo(
    () => [
      t('docs.mistakes.m1'),
      t('docs.mistakes.m2'),
      t('docs.mistakes.m3'),
      t('docs.mistakes.m4'),
    ],
    [t],
  )

  return (
    <div className="space-y-5">
      <SectionCard
        description={t('docs.quick.description')}
        title={t('docs.quick.title')}
      >
        <ol className="space-y-3 text-sm text-[color:var(--color-text-secondary)]">
          {quickStartSteps.map((step, index) => (
            <li className="flex items-start gap-3" key={step}>
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-[var(--radius-pill)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-accent-soft)] text-xs font-semibold text-[color:var(--color-accent)]">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard
        description={t('docs.tools.description')}
        title={t('docs.tools.title')}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {toolGuides.map((guide) => (
            <article
              className="rounded-[var(--radius-control)] border border-[color:var(--color-border-subtle)] bg-[rgba(18,35,44,0.56)] p-4"
              key={guide.title}
            >
              <h3 className="text-base font-semibold tracking-[-0.02em] text-[color:var(--color-text-primary)]">{guide.title}</h3>
              <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">{guide.description}</p>
              <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-text-secondary)]">
                {guide.bullets.map((item) => (
                  <li className="flex items-start gap-2" key={item}>
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-[var(--radius-pill)] bg-[color:var(--color-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        description={t('docs.interpret.description')}
        title={t('docs.interpret.title')}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[var(--radius-control)] border border-[color:var(--color-border-subtle)] bg-[rgba(13,26,33,0.72)] p-4">
            <h3 className="text-base font-semibold tracking-[-0.02em] text-[color:var(--color-text-primary)]">{t('docs.interpret.cardTitle')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-text-secondary)]">
              {interpretationTips.map((tip) => (
                <li className="flex items-start gap-2" key={tip}>
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-[var(--radius-pill)] bg-[color:var(--color-info)]" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-[var(--radius-control)] border border-[color:var(--color-border-subtle)] bg-[rgba(13,26,33,0.72)] p-4">
            <h3 className="text-base font-semibold tracking-[-0.02em] text-[color:var(--color-text-primary)]">{t('docs.mistakes.cardTitle')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-text-secondary)]">
              {commonMistakes.map((mistake) => (
                <li className="flex items-start gap-2" key={mistake}>
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-[var(--radius-pill)] bg-[color:var(--color-warning)]" />
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </SectionCard>
    </div>
  )
}
