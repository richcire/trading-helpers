export type Direction = 'LONG' | 'SHORT'

export type InputMode = 'qty' | 'amount'

export type StopTakeMode = 'pct' | 'amount'

export type MarketType = 'stock' | 'fx'

export type Tone = 'neutral' | 'accent' | 'profit' | 'loss' | 'warning'

export type SurfaceLevel = 'base' | 'raised' | 'overlay'

export type FieldState = 'default' | 'error' | 'disabled'

export type RiskMode = 'pct' | 'amount'

export type SimulatorYAxis = 'amount' | 'pct' | 'roi'

export type LanguageCode = 'en' | 'ko' | 'ja'

export const CURRENCY_CODES = ['USD', 'EUR', 'JPY', 'GBP', 'CNY', 'CHF', 'AUD', 'CAD', 'HKD', 'SGD'] as const

export type CurrencyCode = (typeof CURRENCY_CODES)[number]

export interface CalculationTooltipPayload {
  title: string
  formula: string
  substitution: string
  result: string
  note?: string
  tone?: Tone
}

export interface Settings {
  language: LanguageCode
  currency: CurrencyCode
  leverage: number
  feeEntryPct: number
  feeExitPct: number
  includeFeesInPnL: boolean
  adjustStopTakePriceForFees: boolean
  marketType: MarketType
}

export interface EntryRow {
  id: string
  price: string
  qty: string
  amount: string
  mode: InputMode
}

export interface StopTakeConfig {
  mode: StopTakeMode
  value: string
}

export interface PnlResult {
  pnlAmount: number
  pnlPct: number
  roiPct?: number
}

export interface AvgPriceResult {
  E: number
  Q: number
  totalCost: number
}

export interface SimPoint {
  price: number
  pnlAmount: number
  pnlPct: number
  roiPct?: number
}

export type ExpectancyMode = 'rr' | 'amount'

export interface ExpectancyResult {
  expectancy: number
  breakEvenWinRate: number
  isPositive: boolean
}

export interface RouteMeta {
  id: string
  path: string
  label: string
  title: string
  description: string
  canonicalPath: string
  introTitle: string
  introDescription: string
}
