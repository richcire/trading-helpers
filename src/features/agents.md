# features/agents.md

> 각 기능 페이지의 구조와 구현 규칙.
> 구현 순서: avgCalc → dca → sizing → simulator → expectancy

---

## 공통 구조 규칙

각 기능 폴더는 아래 구조를 따른다:

```
features/[기능명]/
├── [기능명]Page.tsx   # 페이지 최상위 컴포넌트
└── use[기능명].ts     # 상태 + 계산 커스텀 훅
```

**훅 설계 원칙:**
- 입력 상태는 `useState`로 관리
- 계산 결과는 `useMemo`로 도출 (`useEffect` 계산 금지)
- `useSettingsStore`에서 settings를 읽어 계산 함수에 전달
- 훅이 반환하는 것: `{ 입력 상태들, 결과, 핸들러들 }`

---

## 경로/메타 규칙

- 각 기능 페이지는 고유 경로와 SEO 메타(`title`, `description`, `canonical`)를 가진다.
- 경로 매핑:
  - avgCalc → `/avg-price`
  - dca → `/dca`
  - sizing → `/position-sizing`
  - simulator → `/simulator`
  - expectancy → `/expectancy`
- 페이지 상단에는 기능 검색 의도를 명확히 보여주는 한글 소개 문구를 유지한다.
- 탭 전환은 로컬 state가 아니라 라우팅 이동으로 처리한다.

---

## 기능 1 — avgCalc (평균단가 + 손절/익절)

### 폴더

```
features/avgCalc/
├── AvgCalcPage.tsx
├── EntryRow.tsx        # 분할매수 입력 행 1개 컴포넌트
└── useAvgCalc.ts
```

### useAvgCalc.ts 반환값

```ts
{
  // 입력 상태
  direction: Direction
  entries: EntryRow[]
  stopConfig: StopTakeConfig
  takeConfig: StopTakeConfig
  currentPrice: string

  // 계산 결과
  result: {
    avgPrice: AvgPriceResult
    stopPrice: number
    stopPnl: PnlResult
    takePrice: number
    takePnl: PnlResult
    currentPnl: PnlResult | null   // currentPrice 입력 시
  } | null

  // 핸들러
  setDirection: (d: Direction) => void
  addEntry: () => void
  removeEntry: (id: string) => void
  updateEntry: (id: string, field: keyof EntryRow, value: string) => void
  setStopConfig: (c: Partial<StopTakeConfig>) => void
  setTakeConfig: (c: Partial<StopTakeConfig>) => void
  setCurrentPrice: (v: string) => void
}
```

### EntryRow.tsx Props

```tsx
interface Props {
  row: EntryRow
  onChange: (id: string, field: keyof EntryRow, value: string) => void
  onRemove: (id: string) => void
  showRemove: boolean   // 행이 1개일 때는 삭제 버튼 숨김
}
```

### 실시간 계산 패턴

```ts
const result = useMemo(() => {
  const avg = calcAvgPrice(entries)
  if (!avg) return null

  const stopPct = stopConfig.mode === 'pct' ? -Math.abs(parseFloat(stopConfig.value)) : 0
  const stopPrice = stopConfig.mode === 'pct'
    ? calcStopTakeByPct(direction, avg.E, stopPct, settings)
    : calcStopTakeByAmount(direction, avg.E, avg.Q, -Math.abs(parseFloat(stopConfig.value)), settings)

  // ... 나머지 계산
  return { avg, stopPrice, stopPnl, takePrice, takePnl, currentPnl }
}, [entries, direction, stopConfig, takeConfig, currentPrice, settings])
```

---

## 기능 2 — dca (DCA 물타기)

### 폴더

```
features/dca/
├── DcaPage.tsx
└── useDca.ts
```

### useDca.ts 반환값

```ts
{
  // 입력 상태
  direction: Direction
  oldAvgPrice: string
  oldQty: string
  addPrice: string
  addQty: string
  addMode: InputMode     // qty or amount
  addAmount: string
  currentPrice: string

  // 계산 결과
  result: {
    newAvgPrice: number
    newQty: number
    breakevenPrice: number
    distanceToBe: number       // 본전까지 필요 이동률 (%)
    currentPnl: PnlResult | null
  } | null

  // 핸들러
  setDirection, setOldAvgPrice, setOldQty,
  setAddPrice, setAddQty, setAddMode, setAddAmount,
  setCurrentPrice
}
```

---

## 기능 3 — sizing (포지션 사이징)

### 폴더

```
features/sizing/
├── SizingPage.tsx
└── useSizing.ts
```

### useSizing.ts 반환값

```ts
{
  // 입력 상태
  direction: Direction
  accountEquity: string
  riskMode: 'pct' | 'amount'
  riskValue: string
  entryPrice: string
  stopPrice: string

  // 계산 결과
  result: {
    riskAmount: number
    riskQty: number
    leverageCapQty: number
    qty: number
    notional: number
    margin: number
    stopPnl: PnlResult
  } | null
  error: string | null     // 방향 검증 에러

  // 핸들러
  setDirection, setAccountEquity, setRiskMode,
  setRiskValue, setEntryPrice, setStopPrice
}
```

---

## 기능 4 — simulator (포지션 시뮬레이터)

### 폴더

```
features/simulator/
├── SimulatorPage.tsx
├── SimChart.tsx          # recharts 차트 컴포넌트
└── useSimulator.ts
```

### useSimulator.ts 반환값

```ts
{
  // 입력 상태
  direction: Direction
  avgPrice: string
  qty: string
  minPrice: string
  maxPrice: string
  stopPrice: string       // 차트 마커용 (선택)
  takePrice: string       // 차트 마커용 (선택)
  currentPrice: string    // 차트 마커용 (선택)
  yAxis: 'amount' | 'pct' | 'roi'   // y축 표시 방식

  // 계산 결과
  points: SimPoint[]

  // 핸들러
  setDirection, setAvgPrice, setQty,
  setMinPrice, setMaxPrice,
  setStopPrice, setTakePrice, setCurrentPrice,
  setYAxis
}
```

### SimChart.tsx

- `recharts`의 `LineChart` 사용
- x축: price
- y축: yAxis 설정에 따라 `pnlAmount` / `pnlPct` / `roiPct`
- 수직선 마커 (`ReferenceLine`):
  - 평균단가 → 회색
  - 손절가 → 빨간색
  - 익절가 → 초록색
  - 현재가 → 노란색
- 툴팁: 해당 price의 pnlAmount, pnlPct, roiPct 표시

---

## 기능 5 — expectancy (기대값 분석)

### 폴더

```
features/expectancy/
├── ExpectancyPage.tsx
└── useExpectancy.ts
```

### useExpectancy.ts 반환값

```ts
{
  // 입력 상태
  mode: ExpectancyMode     // 'rr' | 'amount'
  winRatePct: string
  RR: string               // rr 모드
  avgWin: string           // amount 모드
  avgLoss: string          // amount 모드

  // 계산 결과
  result: ExpectancyResult | null

  // 차트 데이터 (손익비 변화에 따른 손익분기 승률 커브)
  curvePoints: { RR: number; breakEvenWinRate: number }[]

  // 핸들러
  setMode, setWinRatePct, setRR, setAvgWin, setAvgLoss
}
```

### 결과 표시

- 기대값 양수: 초록색 + "수익 가능 전략"
- 기대값 음수: 빨간색 + "손익분기 미달"
- 손익분기 승률과 현재 입력 승률 비교 표시
