import { useMemo } from 'react'

import { useSettingsStore } from '../../store/useSettingsStore'
import type { CalculationTooltipPayload } from '../../types'
import { formatCurrencyUnit, formatCurrencyValue, formatNumber } from '../../utils/format'
import { ActionButton } from '../../components/ui/ActionButton'
import { ValueWithTooltip } from '../../components/ui/CalculationTooltip'
import { InputRow } from '../../components/ui/InputRow'
import { MetricRow } from '../../components/ui/MetricRow'
import { PnlBadge } from '../../components/ui/PnlBadge'
import { ResultCard } from '../../components/ui/ResultCard'
import { SectionCard } from '../../components/ui/SectionCard'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useDca } from './useDca'

export function DcaPage() {
  const { settings } = useSettingsStore()
  const currencyUnit = formatCurrencyUnit(settings.currency)
  const {
    addAmount,
    addMode,
    addPrice,
    addQty,
    currentPrice,
    direction,
    oldAvgPrice,
    oldQty,
    reset,
    result,
    setAddAmount,
    setAddMode,
    setAddPrice,
    setAddQty,
    setCurrentPrice,
    setDirection,
    setOldAvgPrice,
    setOldQty,
  } = useDca()

  const tooltips = useMemo(() => {
    if (!result) {
      return null
    }

    const prevE = Number.parseFloat(oldAvgPrice)
    const prevQ = Number.parseFloat(oldQty)
    const addP = Number.parseFloat(addPrice)
    const addQ = addMode === 'qty' ? Number.parseFloat(addQty) : Number.parseFloat(addAmount) / addP
    const mark = Number.parseFloat(currentPrice)

    const newAvg: CalculationTooltipPayload = {
      title: '새 평균단가',
      formula: 'newE = (oldE×oldQ + addP×addQ) / (oldQ + addQ)',
      substitution: `(${formatNumber(prevE, 4)}×${formatNumber(prevQ, 4)} + ${formatNumber(addP, 4)}×${formatNumber(addQ, 4)}) / ${formatNumber(result.newQty, 4)}`,
      result: formatCurrencyValue(result.newAvgPrice, settings.currency, 4),
      note: addMode === 'amount' ? 'addQ = addAmount / addPrice 로 환산합니다.' : undefined,
      tone: 'accent',
    }

    const newQty: CalculationTooltipPayload = {
      title: '새 총수량',
      formula: 'newQ = oldQ + addQ',
      substitution: `${formatNumber(prevQ, 4)} + ${formatNumber(addQ, 4)}`,
      result: `${formatNumber(result.newQty, 4)}`,
      tone: 'accent',
    }

    const breakeven: CalculationTooltipPayload = {
      title: '본전가',
      formula: 'P_be = E (수수료 OFF) / E×(1±f_in)/(1∓f_out) (수수료 ON)',
      substitution: `direction=${direction}, E=${formatNumber(result.newAvgPrice, 4)}`,
      result: formatCurrencyValue(result.breakevenPrice, settings.currency, 4),
      tone: 'warning',
    }

    const distance: CalculationTooltipPayload = {
      title: '본전까지 필요 이동률',
      formula: direction === 'LONG' ? 'distance = ((P_be - mark) / mark) × 100' : 'distance = ((mark - P_be) / mark) × 100',
      substitution: `P_be=${formatNumber(result.breakevenPrice, 4)}, mark=${Number.isFinite(mark) ? formatNumber(mark, 4) : '-'}`,
      result: typeof result.distanceToBe === 'number' ? `${formatNumber(result.distanceToBe, 2)}%` : '-',
      tone: 'warning',
    }

    const currentAmount: CalculationTooltipPayload | null = result.currentPnl
      ? {
        title: '현재 손익',
        formula: 'pnlAmount = s × (P - E) × Q',
        substitution: `P=${Number.isFinite(mark) ? formatNumber(mark, 4) : '-'}, E=${formatNumber(result.newAvgPrice, 4)}, Q=${formatNumber(result.newQty, 4)}`,
        result: formatCurrencyValue(result.currentPnl.pnlAmount, settings.currency, 2),
        tone: result.currentPnl.pnlAmount >= 0 ? 'profit' : 'loss',
      }
      : null

    const currentPct: CalculationTooltipPayload | null = result.currentPnl
      ? {
        title: '현재 손익률',
        formula: 'pnlPct = (pnlAmount / baseCost) × 100',
        substitution: `pnlAmount=${formatNumber(result.currentPnl.pnlAmount, 2)}`,
        result: `${formatNumber(result.currentPnl.pnlPct, 2)}%`,
        tone: result.currentPnl.pnlPct >= 0 ? 'profit' : 'loss',
      }
      : null

    const currentRoi: CalculationTooltipPayload | null = result.currentPnl && typeof result.currentPnl.roiPct === 'number'
      ? {
        title: '현재 ROI',
        formula: 'roiPct = (pnlAmount / margin) × 100',
        substitution: `pnlAmount=${formatNumber(result.currentPnl.pnlAmount, 2)}`,
        result: `${formatNumber(result.currentPnl.roiPct, 2)}%`,
        tone: result.currentPnl.roiPct >= 0 ? 'profit' : 'loss',
      }
      : null

    return { newAvg, newQty, breakeven, distance, currentAmount, currentPct, currentRoi }
  }, [addAmount, addMode, addPrice, addQty, currentPrice, direction, oldAvgPrice, oldQty, result, settings.currency])

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-5">
        <SectionCard
          actions={
            <ActionButton onClick={reset} tone="warning" variant="outline">
              현재 입력 초기화
            </ActionButton>
          }
          description="기존 포지션에 추가 진입했을 때 평균단가와 본전가가 어디로 이동하는지 계산합니다."
          eyebrow="DCA"
          title="물타기 계산기"
        >
          <div className="space-y-4">
            <SegmentedControl
              onChange={setDirection}
              options={[
                { label: 'LONG', value: 'LONG' },
                { label: 'SHORT', value: 'SHORT' },
              ]}
              tone={direction === 'LONG' ? 'profit' : 'loss'}
              value={direction}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <InputRow inputMode="decimal" label="기존 평균단가" onChange={setOldAvgPrice} tone="accent" type="number" unit={currencyUnit} value={oldAvgPrice} />
              <InputRow inputMode="decimal" label="기존 수량" onChange={setOldQty} tone="accent" type="number" value={oldQty} />
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Add Position" title="추가 진입">
          <div className="space-y-4">
            <SegmentedControl
              onChange={setAddMode}
              options={[
                { label: '수량', value: 'qty' },
                { label: '금액', value: 'amount' },
              ]}
              value={addMode}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <InputRow inputMode="decimal" label="추가 진입가" onChange={setAddPrice} tone="accent" type="number" unit={currencyUnit} value={addPrice} />
              {addMode === 'qty' ? (
                <InputRow inputMode="decimal" label="추가 수량" onChange={setAddQty} tone="accent" type="number" value={addQty} />
              ) : (
                <InputRow inputMode="decimal" label="추가 금액" onChange={setAddAmount} tone="accent" type="number" unit={currencyUnit} value={addAmount} />
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Mark Price" title="현재가">
          <InputRow inputMode="decimal" label="현재가" onChange={setCurrentPrice} tone="warning" type="number" unit={currencyUnit} value={currentPrice} />
        </SectionCard>
      </div>

      <div className="space-y-5">
        <ResultCard title="DCA 결과">
          {result && tooltips ? (
            <div>
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">New Average</p>
                <ValueWithTooltip className="mt-2" tone="accent" tooltip={tooltips.newAvg}>
                  <p className="text-data text-3xl font-semibold tracking-[-0.05em]">{formatNumber(result.newAvgPrice)}</p>
                </ValueWithTooltip>
              </div>
              <MetricRow label="새 평균단가" tooltip={tooltips.newAvg} value={formatCurrencyValue(result.newAvgPrice, settings.currency)} />
              <MetricRow label="새 총수량" tooltip={tooltips.newQty} value={formatNumber(result.newQty, 4)} />
              <MetricRow label="본전가" tooltip={tooltips.breakeven} value={formatCurrencyValue(result.breakevenPrice, settings.currency)} />
              <MetricRow
                label="본전까지 필요 이동률"
                tooltip={tooltips.distance}
                value={
                  typeof result.distanceToBe === 'number' ? (
                    <PnlBadge format="pct" size="sm" value={result.distanceToBe} />
                  ) : (
                    '-'
                  )
                }
              />
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">기존 포지션과 추가 진입값을 입력하면 새 평균단가를 계산합니다.</p>
          )}
        </ResultCard>

        <ResultCard title="현재 평가손익">
          {result?.currentPnl && tooltips?.currentAmount && tooltips.currentPct ? (
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">Current PnL</p>
                  <ValueWithTooltip className="mt-2" tone={result.currentPnl.pnlAmount >= 0 ? 'profit' : 'loss'} tooltip={tooltips.currentAmount}>
                    <p className="text-data text-3xl font-semibold tracking-[-0.05em]">{formatNumber(result.currentPnl.pnlAmount)}</p>
                  </ValueWithTooltip>
                </div>
                <PnlBadge value={result.currentPnl.pnlAmount} />
              </div>
              <div className="mt-5">
                <MetricRow label="손익률" tooltip={tooltips.currentPct} value={<PnlBadge format="pct" size="sm" value={result.currentPnl.pnlPct} />} />
                {typeof result.currentPnl.roiPct === 'number' && tooltips.currentRoi && (
                  <MetricRow label="ROI" tooltip={tooltips.currentRoi} value={<PnlBadge format="pct" size="sm" value={result.currentPnl.roiPct} />} />
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">현재가를 입력하면 현재 평가손익과 본전까지의 거리도 함께 표시됩니다.</p>
          )}
        </ResultCard>
      </div>
    </div>
  )
}
