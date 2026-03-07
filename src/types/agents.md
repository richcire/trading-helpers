# types/agents.md

> `src/types/index.ts` 하나의 파일에 프로젝트 전체 타입을 정의한다.
> 타입을 추가할 때는 반드시 이 문서에도 함께 업데이트한다.

---

## 기본 유니온 타입

```ts
// 포지션 방향
export type Direction = 'LONG' | 'SHORT'

// 수량 입력 방식: 수량(qty) 또는 금액(amount)
export type InputMode = 'qty' | 'amount'

// 손절/익절 설정 방식: 퍼센트 또는 금액
export type StopTakeMode = 'pct' | 'amount'

export const CURRENCY_CODES = ['USD', 'EUR', 'JPY', 'GBP', 'CNY', 'CHF', 'AUD', 'CAD', 'HKD', 'SGD'] as const
export type CurrencyCode = (typeof CURRENCY_CODES)[number]
```

---

## 전역 설정

```ts
export interface Settings {
  currency: CurrencyCode         // 표시 통화 코드, 기본값 'USD'
  leverage: number               // >= 1, 기본값 1 (현물)
  feeEntryPct: number            // 진입 수수료 % 단위 입력 (예: 0.05), 기본값 0
  feeExitPct: number             // 청산 수수료 % 단위 입력, 기본값 0
  includeFeesInPnL: boolean      // 손익 계산 시 수수료 반영 여부, 기본값 true
  adjustStopTakePriceForFees: boolean  // 손절/익절 가격 자체를 수수료 보정, 기본값 false
}
```

**정책:**
- `adjustStopTakePriceForFees = true`이면 `includeFeesInPnL`은 항상 `true`로 강제
- 내부 계산에서 수수료율 변환: `f_in = feeEntryPct / 100`

---

## 기능 1 — 평균단가 + 손절/익절

```ts
// 분할매수 입력 행 1개
export interface EntryRow {
  id: string         // 행 고유 ID (crypto.randomUUID() 사용)
  price: string      // input value로 관리 (문자열)
  qty: string
  amount: string
  mode: InputMode    // 이 행의 입력 방식
}

// 기능 1 손절/익절 설정
export interface StopTakeConfig {
  mode: StopTakeMode
  value: string      // % 또는 금액 (문자열, input value)
}
```

---

## 공통 계산 결과

```ts
// 손익 계산 결과
export interface PnlResult {
  pnlAmount: number
  pnlPct: number
  roiPct?: number    // leverage > 1일 때만 존재
}

// 평균단가 계산 결과
export interface AvgPriceResult {
  E: number          // 평균단가
  Q: number          // 총 수량
  totalCost: number  // 총 투입 금액 (E × Q)
}

// 결과값 계산 설명 툴팁
export interface CalculationTooltipPayload {
  title: string
  formula: string
  substitution: string
  result: string
  note?: string
  tone?: Tone
}
```

---

## 기능 4 — 시뮬레이터

```ts
// 시뮬레이션 포인트 1개 (차트 데이터)
export interface SimPoint {
  price: number
  pnlAmount: number
  pnlPct: number
  roiPct?: number
}
```

---

## 기능 5 — 기대값

```ts
// 기대값 입력 방식
export type ExpectancyMode = 'rr' | 'amount'  // 손익비 모드 or 금액 직접 입력 모드

export interface ExpectancyResult {
  expectancy: number         // 기대값 (R 배수 또는 금액)
  breakEvenWinRate: number   // 손익분기 승률 (0~1)
  isPositive: boolean        // 양의 기대값 여부
}
```

---

## 라우팅/SEO 메타

```ts
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
```

---

## 네이밍 규칙

| 구분 | 규칙 | 예시 |
|------|------|------|
| input value | 문자열(`string`)로 관리 | `price: string` |
| 계산 결과 | 숫자(`number`)로 반환 | `E: number` |
| boolean 옵션 | `is-` 또는 명확한 동사형 | `includeFeesInPnL` |
| 결과 인터페이스 | `~Result` 접미사 | `PnlResult` |
