import { useEffect, useState } from 'react'

import { useSettingsStore } from '../../store/useSettingsStore'
import { CURRENCY_CODES, type CurrencyCode } from '../../types'
import { validateSettings } from '../../utils/validate'
import { ActionButton } from '../ui/ActionButton'
import { InputRow } from '../ui/InputRow'
import { SectionCard } from '../ui/SectionCard'

interface Props {
  onClose: () => void
}

export function SettingsModal({ onClose }: Props) {
  const { resetSettings, setSettings, settings } = useSettingsStore()
  const errors = validateSettings(settings)
  const [leverageInput, setLeverageInput] = useState(() => String(settings.leverage))
  const [feeEntryInput, setFeeEntryInput] = useState(() => String(settings.feeEntryPct))
  const [feeExitInput, setFeeExitInput] = useState(() => String(settings.feeExitPct))

  const handleNumberInput = (value: string, apply: (next: number) => void) => {
    if (value.trim() === '') {
      apply(0)
      return
    }

    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      apply(parsed)
    }
  }

  const handleReset = () => {
    resetSettings()
    setLeverageInput('1')
    setFeeEntryInput('0')
    setFeeExitInput('0')
  }

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.classList.add('modal-open')
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <button
        aria-label="설정 닫기"
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        type="button"
      />
      <SectionCard
        actions={
          <ActionButton onClick={onClose} variant="ghost">
            닫기
          </ActionButton>
        }
        className="relative z-10 w-full max-w-2xl"
        description="수수료 반영 방식과 레버리지 기준을 전역으로 통일합니다."
        eyebrow="Global Settings"
        surface="overlay"
        title="공통 계산 환경"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2.5">
            <span className="text-sm font-medium text-[color:var(--color-text-primary)]">기준 통화</span>
            <div className="flex min-h-12 items-center rounded-[var(--radius-control)] border border-[color:var(--color-border-subtle)] bg-black/10 px-4 transition duration-200 ease-out focus-within:border-[rgba(82,199,222,0.7)] focus-within:bg-[rgba(82,199,222,0.06)]">
              <select
                className="text-data w-full border-none bg-transparent text-sm font-medium tracking-[-0.02em] text-[color:var(--color-text-primary)] outline-none"
                onChange={(event) => setSettings({ currency: event.target.value as CurrencyCode })}
                value={settings.currency}
              >
                {CURRENCY_CODES.map((currency) => (
                  <option className="bg-[color:var(--color-bg-base)]" key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-[color:var(--color-text-muted)]">표시 단위만 변경되며 환율 변환은 하지 않습니다.</p>
          </label>
          <InputRow
            hint="증거금과 ROI 계산에만 영향을 줍니다."
            inputMode="decimal"
            label="레버리지"
            onChange={(value) => {
              setLeverageInput(value)
              handleNumberInput(value, (next) => setSettings({ leverage: next }))
            }}
            type="number"
            unit="x"
            value={leverageInput}
          />
          <InputRow
            hint="예: 0.05"
            inputMode="decimal"
            label="진입 수수료"
            onChange={(value) => {
              setFeeEntryInput(value)
              handleNumberInput(value, (next) => setSettings({ feeEntryPct: next }))
            }}
            type="number"
            unit="%"
            value={feeEntryInput}
          />
          <InputRow
            hint="예: 0.05"
            inputMode="decimal"
            label="청산 수수료"
            onChange={(value) => {
              setFeeExitInput(value)
              handleNumberInput(value, (next) => setSettings({ feeExitPct: next }))
            }}
            type="number"
            unit="%"
            value={feeExitInput}
          />
        </div>

        <div className="my-5 h-px bg-white/8" />

        <div className="space-y-3">
          <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-control)] border border-[color:var(--color-border-subtle)] bg-black/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-primary)]">손익 계산에 수수료 포함</p>
              <p className="text-xs text-[color:var(--color-text-muted)]">PnL, 손익률, ROI 계산에 적용합니다.</p>
            </div>
            <input
              checked={settings.includeFeesInPnL}
              className="size-4 cursor-pointer accent-[var(--color-accent)] disabled:cursor-not-allowed"
              disabled={settings.adjustStopTakePriceForFees}
              onChange={(event) => setSettings({ includeFeesInPnL: event.target.checked })}
              type="checkbox"
            />
          </label>
          <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-control)] border border-[color:var(--color-border-subtle)] bg-black/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-primary)]">손절/익절 가격 자체를 수수료 보정</p>
              <p className="text-xs text-[color:var(--color-text-muted)]">활성화하면 손익 계산의 수수료 포함도 자동으로 활성화됩니다.</p>
            </div>
            <input
              checked={settings.adjustStopTakePriceForFees}
              className="size-4 cursor-pointer accent-[var(--color-accent)] disabled:cursor-not-allowed"
              onChange={(event) => setSettings({ adjustStopTakePriceForFees: event.target.checked })}
              type="checkbox"
            />
          </label>
        </div>

        {errors.length > 0 && (
          <div className="mt-5 rounded-[var(--radius-control)] border border-[rgba(255,107,122,0.2)] bg-[rgba(255,107,122,0.08)] px-4 py-3">
            <ul className="space-y-1 text-sm text-[color:var(--color-loss)]">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end">
          <ActionButton onClick={handleReset} tone="warning" variant="outline">
            기본값으로 초기화
          </ActionButton>
        </div>
      </SectionCard>
    </div>
  )
}
