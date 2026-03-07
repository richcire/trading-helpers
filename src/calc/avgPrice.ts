import type { AvgPriceResult, EntryRow } from '../types'

export function calcAvgPrice(entries: EntryRow[]): AvgPriceResult | null {
  if (entries.length === 0) {
    return null
  }

  let totalQty = 0
  let totalCost = 0

  for (const entry of entries) {
    const price = Number.parseFloat(entry.price)
    if (!Number.isFinite(price) || price <= 0) {
      continue
    }

    const qty =
      entry.mode === 'amount'
        ? Number.parseFloat(entry.amount) / price
        : Number.parseFloat(entry.qty)

    if (!Number.isFinite(qty) || qty <= 0) {
      continue
    }

    totalQty += qty
    totalCost += price * qty
  }

  if (totalQty <= 0) {
    return null
  }

  return {
    E: totalCost / totalQty,
    Q: totalQty,
    totalCost,
  }
}
