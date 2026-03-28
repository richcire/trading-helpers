import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useI18n } from '../../i18n'
import type { Direction, SimulatorYAxis, SimPoint } from '../../types'
import { formatNumber, formatPct, formatPnl } from '../../utils/format'

interface Props {
  points: SimPoint[]
  yAxis: SimulatorYAxis
  direction: Direction
  currencyUnit: string
  entryPrice?: number | null
  qty?: number | null
  avgPrice?: number | null
  stopPrice?: number | null
  takePrice?: number | null
  currentPrice?: number | null
}

interface TooltipPayloadItem {
  payload: SimPoint & { value: number }
}

interface ChartTooltipProps {
  active?: boolean
  payload?: readonly TooltipPayloadItem[]
}

function getValue(point: SimPoint, yAxis: SimulatorYAxis) {
  if (yAxis === 'pct') {
    return point.pnlPct
  }

  if (yAxis === 'roi') {
    return point.roiPct ?? 0
  }

  return point.pnlAmount
}

function interpolateValueAtPrice(
  data: Array<SimPoint & { value: number }>,
  price: number,
): number | null {
  if (!Number.isFinite(price) || data.length === 0) {
    return null
  }

  const first = data[0]
  const last = data[data.length - 1]

  if (!first || !last || price < first.price || price > last.price) {
    return null
  }

  let left = 0
  let right = data.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const point = data[mid]
    if (!point) {
      return null
    }

    if (point.price === price) {
      return point.value
    }

    if (point.price < price) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  const low = data[Math.max(0, right)]
  const high = data[Math.min(data.length - 1, left)]

  if (!low || !high || high.price === low.price) {
    return low?.value ?? null
  }

  const ratio = (price - low.price) / (high.price - low.price)
  return low.value + (high.value - low.value) * ratio
}

function formatYAxisMarkerValue(value: number, yAxis: SimulatorYAxis) {
  if (yAxis === 'amount') {
    return formatNumber(value, 2)
  }

  return formatPct(value, 2)
}

export function SimChart({ avgPrice, currencyUnit, currentPrice, direction, entryPrice, points, qty, stopPrice, takePrice, yAxis }: Props) {
  const { t } = useI18n()
  const data = points.map((point) => ({
    ...point,
    value: getValue(point, yAxis),
  }))
  const minChartPrice = data[0]?.price
  const yMarkers = ([
    { key: 'stop', price: stopPrice, stroke: 'var(--color-loss)' },
    { key: 'take', price: takePrice, stroke: 'var(--color-profit)' },
    { key: 'current', price: currentPrice, stroke: 'var(--color-warning)' },
  ] as const).flatMap((marker) => {
    if (typeof marker.price !== 'number') {
      return []
    }

    const yValue = interpolateValueAtPrice(data, marker.price)
    if (yValue === null) {
      return []
    }

    return [{ ...marker, yValue }]
  })

  const renderTooltipContent = ({ active, payload }: ChartTooltipProps) => {
    if (!active || !payload || payload.length === 0) {
      return null
    }

    const point = payload[0].payload
    const sign = direction === 'LONG' ? 1 : -1

    return (
      <div className="w-[min(90vw,22rem)] rounded-[var(--radius-control)] border border-[color:var(--color-border-strong)] panel-elevated p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-accent)]">{t('sim.tooltip.hoverTitle')}</p>
        <div className="mt-2 space-y-1 text-xs text-[color:var(--color-text-secondary)]">
          <p>
            <span className="mr-1 text-[color:var(--color-text-muted)]">{t('common.formula')}</span>
            <span className="text-data">pnlAmount = s × (P - E) × Q</span>
          </p>
          <p>
            <span className="mr-1 text-[color:var(--color-text-muted)]">{t('common.substitution')}</span>
            <span className="text-data">
              s={sign}, P={formatNumber(point.price, 4)}, E={entryPrice ? formatNumber(entryPrice, 4) : '-'}, Q={qty ? formatNumber(qty, 4) : '-'}
            </span>
          </p>
          <p>
            <span className="mr-1 text-[color:var(--color-text-muted)]">{t('common.result')}</span>
            <span className="text-data font-semibold text-[color:var(--color-text-primary)]">{formatPnl(point.pnlAmount)} {currencyUnit}</span>
          </p>
        </div>
        <div className="mt-2 border-t border-white/8 pt-2 text-xs text-[color:var(--color-text-secondary)]">
          <p>{t('common.pnlPct')}: <span className="text-data">{formatPct(point.pnlPct, 2)}</span></p>
          <p>{t('common.roi')}: <span className="text-data">{typeof point.roiPct === 'number' ? formatPct(point.roiPct, 2) : '-'}</span></p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="99%" height={336}>
        <LineChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="price"
            domain={['dataMin', 'dataMax']}
            minTickGap={32}
            stroke="var(--color-text-muted)"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            tickFormatter={(value: number) => formatNumber(value, 2)}
            type="number"
          />
          <YAxis
            stroke="var(--color-text-muted)"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            tickFormatter={(value: number) => (yAxis === 'amount' ? formatNumber(value, 0) : formatPct(value, 1))}
          />
          <Tooltip content={renderTooltipContent} />
          <Line dataKey="value" dot={false} isAnimationActive={false} stroke="var(--color-accent)" strokeWidth={2.5} type="monotone" />
          {typeof avgPrice === 'number' && <ReferenceLine stroke="var(--color-text-muted)" strokeDasharray="4 4" x={avgPrice} />}
          {typeof stopPrice === 'number' && <ReferenceLine stroke="var(--color-loss)" strokeDasharray="4 4" x={stopPrice} />}
          {typeof takePrice === 'number' && <ReferenceLine stroke="var(--color-profit)" strokeDasharray="4 4" x={takePrice} />}
          {typeof currentPrice === 'number' && <ReferenceLine stroke="var(--color-warning)" strokeDasharray="4 4" x={currentPrice} />}
          {yMarkers.map((marker) => (
            <ReferenceLine
              key={marker.key}
              ifOverflow="hidden"
              label={{
                fill: marker.stroke,
                fontSize: 11,
                position: 'left',
                value: formatYAxisMarkerValue(marker.yValue, yAxis),
              }}
              segment={
                typeof minChartPrice === 'number' && typeof marker.price === 'number'
                  ? [
                      { x: minChartPrice, y: marker.yValue },
                      { x: marker.price, y: marker.yValue },
                    ]
                  : undefined
              }
              stroke={marker.stroke}
              strokeDasharray="3 3"
              strokeOpacity={0.4}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
