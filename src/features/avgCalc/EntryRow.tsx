import { useI18n } from '../../i18n'
import { IconButton } from '../../components/ui/IconButton'
import { InputRow } from '../../components/ui/InputRow'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import type { EntryRow as EntryRowType } from '../../types'

interface Props {
  row: EntryRowType
  currencyUnit: string
  onChange: (id: string, field: keyof EntryRowType, value: string) => void
  onRemove: (id: string) => void
  showRemove: boolean
  errors?: {
    price?: string
    qty?: string
    amount?: string
  }
}

export function EntryRow({ currencyUnit, errors, onChange, onRemove, row, showRemove }: Props) {
  const { t } = useI18n()

  return (
    <div className="rounded-[var(--radius-control)] border border-[color:var(--color-border-subtle)] bg-black/10 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold tracking-[-0.02em] text-[color:var(--color-text-primary)]">{t('avg.entryRow')}</p>
        <div className="flex items-center gap-2">
          <SegmentedControl
            className="min-w-[180px]"
            onChange={(value) => onChange(row.id, 'mode', value)}
            options={[
              { label: t('avg.mode.qty'), value: 'qty' },
              { label: t('avg.mode.amount'), value: 'amount' },
            ]}
            tone="accent"
            value={row.mode}
          />
          {showRemove && (
            <IconButton label={t('avg.removeEntry')} onClick={() => onRemove(row.id)}>
              <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
              </svg>
            </IconButton>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputRow
          error={errors?.price}
          inputMode="decimal"
          label={t('avg.input.price')}
          onChange={(value) => onChange(row.id, 'price', value)}
          placeholder="0.00"
          tone="accent"
          type="number"
          unit={currencyUnit}
          value={row.price}
        />
        {row.mode === 'qty' ? (
          <InputRow
            error={errors?.qty}
            inputMode="decimal"
            label={t('avg.input.qty')}
            onChange={(value) => onChange(row.id, 'qty', value)}
            placeholder="0.00"
            tone="accent"
            type="number"
            value={row.qty}
          />
        ) : (
          <InputRow
            error={errors?.amount}
            inputMode="decimal"
            label={t('avg.input.entryAmount')}
            onChange={(value) => onChange(row.id, 'amount', value)}
            placeholder="0.00"
            tone="accent"
            type="number"
            unit={currencyUnit}
            value={row.amount}
          />
        )}
      </div>
    </div>
  )
}
