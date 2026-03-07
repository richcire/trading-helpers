import clsx from 'clsx'
import { useId } from 'react'

import type { FieldState, Tone } from '../../types'
import { FieldError } from './FieldError'
import { FieldHint } from './FieldHint'
import { FieldLabel } from './FieldLabel'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'number'
  placeholder?: string
  unit?: string
  error?: string
  disabled?: boolean
  hint?: string
  inputMode?: 'decimal' | 'numeric'
  tone?: Tone
  min?: number
  max?: number
  step?: number | 'any'
}

const toneClasses: Record<Tone, string> = {
  neutral: 'focus-within:border-[color:var(--color-border-strong)]',
  accent: 'focus-within:border-[rgba(82,199,222,0.7)] focus-within:bg-[rgba(82,199,222,0.06)]',
  profit: 'focus-within:border-[rgba(62,213,152,0.7)] focus-within:bg-[rgba(62,213,152,0.08)]',
  loss: 'focus-within:border-[rgba(255,107,122,0.7)] focus-within:bg-[rgba(255,107,122,0.08)]',
  warning: 'focus-within:border-[rgba(246,199,96,0.7)] focus-within:bg-[rgba(246,199,96,0.08)]',
}

export function InputRow({
  disabled = false,
  error,
  hint,
  inputMode = 'decimal',
  label,
  onChange,
  placeholder,
  min,
  max,
  step,
  tone = 'accent',
  type = 'text',
  unit,
  value,
}: Props) {
  const inputId = useId()
  const state: FieldState = disabled ? 'disabled' : error ? 'error' : 'default'
  const isNumberInput = type === 'number'
  const stepValue = typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1

  const handleStep = (direction: 1 | -1) => {
    if (!isNumberInput || disabled) {
      return
    }

    const current = Number(value)
    const base = Number.isFinite(current) ? current : typeof min === 'number' ? min : 0
    let next = base + direction * stepValue

    if (typeof min === 'number') {
      next = Math.max(min, next)
    }
    if (typeof max === 'number') {
      next = Math.min(max, next)
    }

    const normalized = Number(next.toFixed(10))
    onChange(Number.isFinite(normalized) ? String(normalized) : String(next))
  }

  return (
    <div className="space-y-2.5">
      <FieldLabel htmlFor={inputId} state={state}>
        {label}
      </FieldLabel>
      <div
        className={clsx(
          'flex min-h-12 items-center rounded-[var(--radius-control)] border bg-black/10 px-4 transition duration-200 ease-out',
          error
            ? 'border-[rgba(255,107,122,0.6)] bg-[rgba(255,107,122,0.08)]'
            : 'border-[color:var(--color-border-subtle)]',
          disabled && 'cursor-not-allowed border-white/8 bg-white/4 opacity-70',
          !disabled && !error && toneClasses[tone],
        )}
      >
        <input
          className="text-data w-full border-none bg-transparent px-1 pr-2 text-right text-sm font-medium tracking-[-0.02em] text-[color:var(--color-text-primary)] outline-none placeholder:text-[color:var(--color-text-muted)] disabled:cursor-not-allowed [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
          disabled={disabled}
          id={inputId}
          inputMode={inputMode}
          max={max}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          step={isNumberInput ? step ?? 'any' : undefined}
          type={type}
          value={value}
        />
        {isNumberInput && !disabled && (
          <div className="ml-1 flex shrink-0 items-center gap-1">
            <button
              aria-label={`${label} 감소`}
              className="h-7 w-7 cursor-pointer rounded-[10px] border border-[color:var(--color-border-subtle)] bg-black/20 text-xs font-semibold text-[color:var(--color-text-secondary)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-primary)] active:scale-95"
              onClick={() => handleStep(-1)}
              type="button"
            >
              -
            </button>
            <button
              aria-label={`${label} 증가`}
              className="h-7 w-7 cursor-pointer rounded-[10px] border border-[color:var(--color-border-subtle)] bg-black/20 text-xs font-semibold text-[color:var(--color-text-secondary)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-primary)] active:scale-95"
              onClick={() => handleStep(1)}
              type="button"
            >
              +
            </button>
          </div>
        )}
        {unit && <span className="ml-3 shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">{unit}</span>}
      </div>
      <FieldError>{error}</FieldError>
      {!error && <FieldHint>{hint}</FieldHint>}
    </div>
  )
}
