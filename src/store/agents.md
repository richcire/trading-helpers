# store/agents.md

> 전역 상태는 Zustand로 관리한다.
> 현재 스토어는 `useSettingsStore` 하나만 존재한다.
> 기능별 로컬 상태는 각 `features/` 하위의 커스텀 훅으로 관리한다.

---

## useSettingsStore.ts

### 역할

- 전역 설정(Settings)을 저장하고 앱 전체에 공급한다
- `zustand/middleware`의 `persist`로 LocalStorage에 자동 저장한다
- LocalStorage key: `'trading-settings'`

### 구현

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '../types'

const DEFAULT_SETTINGS: Settings = {
  currency: 'USD',
  leverage: 1,
  feeEntryPct: 0,
  feeExitPct: 0,
  includeFeesInPnL: true,
  adjustStopTakePriceForFees: false,
}

interface SettingsStore {
  settings: Settings
  setSettings: (patch: Partial<Settings>) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      setSettings: (patch) =>
        set((state) => {
          const next = { ...state.settings, ...patch }
          // 정책: adjustStopTakePriceForFees ON이면 includeFeesInPnL 강제 ON
          if (next.adjustStopTakePriceForFees) {
            next.includeFeesInPnL = true
          }
          return { settings: next }
        }),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    { name: 'trading-settings' }
  )
)
```

### 사용법

```ts
// 설정값 읽기
const { settings } = useSettingsStore()

// 설정값 변경
const { setSettings } = useSettingsStore()
setSettings({ leverage: 5 })

// 초기화
const { resetSettings } = useSettingsStore()
```

---

## 정책

| 정책 | 내용 |
|------|------|
| 스토어 추가 기준 | **전역에서 공유가 필요한 상태만** 스토어로 관리. 기능별 입력값은 각 feature 훅에서 `useState`로 관리 |
| persist 범위 | Settings 전체를 통째로 persist |
| 강제 동기화 | `adjustStopTakePriceForFees = true` 시 `includeFeesInPnL = true` 강제 — `setSettings` 내부에서 처리 |
