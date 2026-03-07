# utils/agents.md

> 순수 유틸 함수 모음.
> UI도, store도, calc도 import하지 않는다.

---

## format.ts — 숫자 포맷

### `formatNumber`

```ts
function formatNumber(value: number, decimals = 2): string
```

- 유한수가 아니면 `'-'` 반환
- 천 단위 콤마 + 소수점 자리수 지정
- 로케일: `'ko-KR'`

```ts
formatNumber(1234567.891)     // "1,234,567.89"
formatNumber(0.1, 4)          // "0.1000"
formatNumber(Infinity)        // "-"
```

---

### `formatPnl`

```ts
function formatPnl(value: number, decimals = 2): string
```

- 양수이면 `+` 접두사 추가
- 내부적으로 `formatNumber` 호출

```ts
formatPnl(1500)    // "+1,500.00"
formatPnl(-800)    // "-800.00"
formatPnl(0)       // "0.00"
```

---

### `formatPct`

```ts
function formatPct(value: number, decimals = 2): string
```

- `%` 접미사 포함
- 양수이면 `+` 접두사

```ts
formatPct(3.14)    // "+3.14%"
formatPct(-1.5)    // "-1.50%"
```

---

## validate.ts — 입력값 검증

> input value는 문자열(`string`)로 관리하므로, 검증도 문자열 입력을 기준으로 한다.

### 기본 검증 함수

```ts
function isPositiveNumber(val: string): boolean
// parseFloat 후 isFinite && n > 0

function isNonNegativeNumber(val: string): boolean
// parseFloat 후 isFinite && n >= 0
```

---

### `validateSettings`

```ts
function validateSettings(s: Settings): string[]
// 에러 메시지 배열 반환. 빈 배열이면 유효.
```

검증 항목:
- `leverage < 1` → `'레버리지는 1 이상이어야 합니다'`
- `feeEntryPct < 0 || feeEntryPct >= 100` → `'진입 수수료는 0~100% 미만이어야 합니다'`
- `feeExitPct < 0 || feeExitPct >= 100` → `'청산 수수료는 0~100% 미만이어야 합니다'`

---

### `validateSizingDirection`

```ts
function validateSizingDirection(
  direction: Direction,
  entryPrice: number,
  stopPrice: number
): string | null
// 에러 메시지 또는 null(유효)
```

- LONG인데 `stopPrice >= entryPrice` → `'LONG 포지션의 손절가는 진입가보다 낮아야 합니다'`
- SHORT인데 `stopPrice <= entryPrice` → `'SHORT 포지션의 손절가는 진입가보다 높아야 합니다'`
