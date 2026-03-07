# components/agents.md

> 재사용 가능한 공통 컴포넌트 명세.
> 비즈니스 로직(계산)을 포함하지 않는다. 표시와 입력만 담당한다.
> 구현 전 반드시 루트 `design_system.md`를 먼저 읽는다.

---

## 폴더 구조

```
components/
├── layout/
│   ├── Header.tsx        # 상단 고정 헤더 (서비스명 + 설정 버튼)
│   └── TabNav.tsx        # 5개 기능 경로 이동 탭
├── settings/
│   └── SettingsModal.tsx # 전역 설정 모달
└── ui/
    ├── SectionCard.tsx   # 공통 카드/패널 표면
    ├── ActionButton.tsx  # 공통 버튼
    ├── IconButton.tsx    # 아이콘 전용 버튼
    ├── SegmentedControl.tsx # 방향/모드 전환 토글
    ├── MetricRow.tsx     # 결과 행 표시
    ├── CalculationTooltip.tsx # 결과 계산식 툴팁
    ├── StatusDot.tsx     # 상태 점 표시
    ├── FieldLabel.tsx    # 입력 라벨
    ├── FieldHint.tsx     # 입력 힌트
    ├── FieldError.tsx    # 입력 에러
    ├── InputRow.tsx      # 라벨 + input 조합
    ├── ResultCard.tsx    # 계산 결과 표시 카드
    ├── PnlBadge.tsx      # 손익 금액/% 색상 표시
    └── CopyButton.tsx    # 클립보드 복사 버튼
```

---

## layout/Header.tsx

```tsx
interface Props {
  onSettingsClick: () => void
}
```

- 서비스 이름 표시 (좌측)
- 설정 버튼 (우측) → `onSettingsClick` 호출
- 항상 상단 고정 (`sticky top-0`)

---

## layout/TabNav.tsx

```tsx
interface Tab {
  id: string
  label: string
  to: string
}

interface Props {
  tabs: Tab[]
}
```

- 5개 탭을 가로로 나열
- 탭 클릭 시 `react-router-dom`의 링크 이동으로 URL이 변경되어야 한다
- 활성 탭은 현재 경로와 링크 경로를 비교해 시각적으로 구분한다 (색상 또는 underline)
- 모바일에서는 스크롤 가능하게 (`overflow-x-auto`)

---

## settings/SettingsModal.tsx

- `useSettingsStore`에서 settings를 읽고 `setSettings`로 업데이트
- 닫기 버튼 또는 배경 클릭 시 `onClose` 호출
- 설정 항목:
  - leverage (number input, min=1)
  - feeEntryPct (number input, min=0)
  - feeExitPct (number input, min=0)
  - includeFeesInPnL (checkbox) — `adjustStopTakePriceForFees=true`이면 비활성화
  - adjustStopTakePriceForFees (checkbox)
- 하단 초기화 버튼: `resetSettings()` 호출
- 에러 표시: `validateSettings` 결과가 있으면 인라인 표시

```tsx
interface Props {
  onClose: () => void
}
```

---

## ui/InputRow.tsx

```tsx
interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'number'
  placeholder?: string
  unit?: string          // 우측 단위 표시 (예: '%', 'USD')
  error?: string         // 에러 메시지 (있으면 빨간 테두리 + 메시지)
  disabled?: boolean
  hint?: string
  inputMode?: 'decimal' | 'numeric'
  tone?: Tone
}
```

---

## ui/ResultCard.tsx

```tsx
interface Props {
  title: string
  children: React.ReactNode
  className?: string
  tone?: Tone
  surface?: SurfaceLevel
}
```

- 계산 결과를 감싸는 카드 컨테이너
- 배경색, 라운드, 패딩 적용
- 카드 내부 툴팁은 같은 카드에서 하나만 열리도록 그룹 처리

---

## ui/MetricRow.tsx

```tsx
interface Props {
  label: string
  value: ReactNode
  hint?: string
  tone?: Tone
  className?: string
  tooltip?: CalculationTooltipPayload
}
```

- `tooltip`이 있으면 라벨 옆 정보 아이콘을 표시
- 데스크탑: 행 hover/focus 시 툴팁 표시
- 모바일: 아이콘 탭으로 토글 표시

---

## ui/CalculationTooltip.tsx

```tsx
interface CalculationTooltipPayload {
  title: string
  formula: string
  substitution: string
  result: string
  note?: string
  tone?: Tone
}
```

- 결과 수치 설명 툴팁 공통 프리미티브
- 패널 내용은 `공식`, `대입`, `결과` 3줄 구조
- 카드 외부 클릭 또는 `ESC`로 닫힘

---

## ui/PnlBadge.tsx

```tsx
interface Props {
  value: number         // 손익 금액 또는 %
  format?: 'amount' | 'pct'
  decimals?: number
  showIcon?: boolean
  size?: 'sm' | 'md'
}
```

**색상 규칙:**
```
value > 0  → text-green-400
value < 0  → text-red-400
value === 0 → text-gray-400
```

- `format='amount'`이면 `formatPnl` 사용
- `format='pct'`이면 `formatPct` 사용

---

## ui/CopyButton.tsx

```tsx
interface Props {
  text: string           // 복사할 텍스트
  label?: string         // 버튼 라벨 (기본: '복사')
  variant?: 'ghost' | 'solid'
}
```

- 클릭 시 `navigator.clipboard.writeText(text)`
- 복사 후 2초간 "복사됨" 상태 표시

---

## 공통 규칙

- 모든 컴포넌트는 `export default`가 아닌 **named export** 사용
- props 타입은 같은 파일 상단에 `interface Props` 로 정의
- Tailwind 클래스만 사용 (인라인 style 금지)
- 비즈니스 계산 로직 포함 금지 — 계산은 `calc/`에서, 상태는 훅에서
- 새 공통 UI를 추가하기 전 `design_system.md`에 먼저 규칙을 반영한다
- 손익/활성/경고 상태 색상은 반드시 디자인 시스템 토큰을 사용한다
