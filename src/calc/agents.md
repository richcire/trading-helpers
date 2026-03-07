# calc/agents.md

> 이 폴더의 모든 함수는 **순수 함수**다.
> - 인자만으로 결과를 반환한다
> - store, 컴포넌트, DOM을 절대 import하지 않는다
> - 사이드 이펙트 없음

수식의 원본 정의는 `trading_service_spec_v1.md` 를 우선 참조한다.

---

## 공통 전제

```
s   = direction === 'LONG' ? 1 : -1
f_in  = settings.feeEntryPct / 100
f_out = settings.feeExitPct / 100
```

퍼센트 입력(UI)은 내부 계산 시 반드시 `/100` 변환한다.

---

## pnl.ts — 손익 계산

### `calcPnl`

```ts
function calcPnl(
  direction: Direction,
  E: number,      // 평균단가
  P: number,      // 청산가
  Q: number,      // 수량
  settings: Settings
): PnlResult
```

**수식:**

수수료 OFF (`includeFeesInPnL = false`):
```
pnlAmount = s × (P - E) × Q
baseCost  = E × Q
```

수수료 ON, LONG:
```
pnlAmount = P × Q × (1 - f_out) - E × Q × (1 + f_in)
baseCost  = E × Q × (1 + f_in)
```

수수료 ON, SHORT:
```
pnlAmount = E × Q × (1 - f_in) - P × Q × (1 + f_out)
baseCost  = E × Q × (1 - f_in)
```

공통:
```
pnlPct  = baseCost !== 0 ? (pnlAmount / baseCost) × 100 : 0
margin  = (E × Q) / leverage
roiPct  = margin !== 0 ? (pnlAmount / margin) × 100 : undefined
```

---

## avgPrice.ts — 평균단가 계산

### `calcAvgPrice`

```ts
function calcAvgPrice(entries: EntryRow[]): AvgPriceResult | null
```

**수식:**
```
qty 모드:   totalQty  = Σ qty_i
            totalCost = Σ (price_i × qty_i)

amount 모드: qty_i = amount_i / price_i  → 이후 동일

E = totalCost / totalQty
Q = totalQty
```

**null 반환 조건 (계산 불가):**
- entries가 비어있음
- 유효한 행이 0개 (price ≤ 0, qty ≤ 0)
- totalQty === 0

---

## stopTake.ts — 손절/익절가 계산

### `calcStopTakeByPct`

```ts
function calcStopTakeByPct(
  direction: Direction,
  E: number,
  rPct: number,      // % 입력값. 손절은 음수(-3), 익절은 양수(+5)
  settings: Settings
): number
```

**수식:**

보정 OFF:
```
P = E × (1 + s × r)     // r = rPct / 100
```

보정 ON, LONG:
```
P = E × (1 + r) × (1 + f_in) / (1 - f_out)
```

보정 ON, SHORT:
```
P = E × (1 - r) × (1 - f_in) / (1 + f_out)
```

---

### `calcStopTakeByAmount`

```ts
function calcStopTakeByAmount(
  direction: Direction,
  E: number,
  Q: number,
  targetPnl: number,   // 손절 = 음수, 익절 = 양수
  settings: Settings
): number
```

**수식:**

보정 OFF:
```
P = E + targetPnl / (s × Q)
```

보정 ON, LONG:
```
P = (targetPnl + E × Q × (1 + f_in)) / (Q × (1 - f_out))
```

보정 ON, SHORT:
```
P = (E × Q × (1 - f_in) - targetPnl) / (Q × (1 + f_out))
```

---

## breakeven.ts — 본전가 계산

### `calcBreakeven`

```ts
function calcBreakeven(
  direction: Direction,
  E: number,
  settings: Settings
): number
```

**수식:**

수수료 OFF:
```
P_be = E
```

수수료 ON, LONG:
```
P_be = E × (1 + f_in) / (1 - f_out)
```

수수료 ON, SHORT:
```
P_be = E × (1 - f_in) / (1 + f_out)
```

---

## sizing.ts — 포지션 사이징

### `calcSizing`

```ts
function calcSizing(
  direction: Direction,
  entryPrice: number,
  stopPrice: number,
  riskAmount: number,   // 허용 손실 금액
  settings: Settings
): number | null        // null = 사이징 불가
```

**수식:**

수수료 OFF:
```
lossPerUnit = -s × (stopPrice - entryPrice)
  LONG:  entryPrice - stopPrice
  SHORT: stopPrice - entryPrice
```

수수료 ON, LONG:
```
lossPerUnit = entryPrice × (1 + f_in) - stopPrice × (1 - f_out)
```

수수료 ON, SHORT:
```
lossPerUnit = stopPrice × (1 + f_out) - entryPrice × (1 - f_in)
```

공통:
```
Q = riskAmount / lossPerUnit
```

상한 적용 (features/useSizing에서 최종 수량 결정):
```
leverageCapQty = (accountEquity × leverage) / entryPrice
finalQty = min(Q, leverageCapQty)
```

**null 반환 조건:**
- LONG인데 stopPrice >= entryPrice
- SHORT인데 stopPrice <= entryPrice
- lossPerUnit <= 0

---

## simulation.ts — 시뮬레이션 포인트 생성

### `generateSimulation`

```ts
function generateSimulation(
  direction: Direction,
  E: number,
  Q: number,
  minPrice: number,
  maxPrice: number,
  steps: number,       // 10~1000, 기본 200
  settings: Settings
): SimPoint[]
```

**수식:**
```
clampedSteps = clamp(steps, 10, 1000)

for i in 0..clampedSteps-1:
  price_i = minPrice + i × (maxPrice - minPrice) / (clampedSteps - 1)
  result_i = calcPnl(direction, E, price_i, Q, settings)
  → { price, pnlAmount, pnlPct, roiPct? }
```

**전처리:**
- `minPrice >= maxPrice`이면 두 값을 swap 후 계산

---

## expectancy.ts — 기대값 분석

### `calcExpectancy`

```ts
function calcExpectancy(winRatePct: number, RR: number): number
```

**수식:**
```
p = winRatePct / 100
Expectancy = p × RR - (1 - p) × 1
```

### `calcExpectancyByAmount`

```ts
function calcExpectancyByAmount(winRatePct: number, avgWin: number, avgLoss: number): number
```

**수식:**
```
p = winRatePct / 100
Expectancy = p × avgWin - (1 - p) × avgLoss
```

### `calcBreakevenWinRate`

```ts
function calcBreakevenWinRate(RR: number): number
```

**수식:**
```
breakEvenWinRate = 1 / (1 + RR)
```

---

## 엣지 케이스 처리 규칙

| 상황 | 처리 |
|------|------|
| 분모가 0이 될 수 있는 수식 | 계산 전 체크 후 `null` 또는 `0` 반환 |
| `f_out >= 1` (보정 ON 시 분모 0) | `null` 반환 |
| `isNaN`, `Infinity` 결과 | `null` 반환 |
| steps 범위 초과 | clamp 처리 (에러 던지지 않음) |
