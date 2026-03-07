# 🤖 agents.md — 프로젝트 루트 가이드

> 이 파일은 프로젝트의 전체 지도다.
> 각 폴더에 진입할 때는 해당 폴더의 `agents.md`를 추가로 읽는다.

---

## 0. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 트레이딩 계산 웹서비스 |
| 목적 | 트레이더의 반복 계산 자동화 |
| 범위 | 프론트엔드 전용 — 서버/DB/로그인 없음 |
| 패키지 매니저 | `pnpm` |
| 빌드 도구 | `Vite` |
| UI 프레임워크 | `React` (함수형 컴포넌트 + Hooks 전용) |
| 언어 | `TypeScript` |
| 스타일 | `Tailwind CSS v4` |
| 상태 관리 | `Zustand` (+ persist 미들웨어로 LocalStorage 자동 저장) |
| 라우팅 | `react-router-dom` (BrowserRouter, 경로 기반 라우팅) |
| 차트 | `Recharts` (기능 4 시뮬레이터) |

---

## 1. 기술 스택 설치

```bash
# 프로젝트 생성
pnpm create vite@latest . -- --template react-ts
pnpm install

# 추가 패키지
pnpm add zustand recharts clsx react-router-dom
pnpm add -D tailwindcss @tailwindcss/vite
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

`src/index.css` 최상단:
```css
@import "tailwindcss";
```

---

## 2. 폴더 구조 & agents.md 맵

```
agents.md                        ← 지금 이 파일. 전체 지도.
src/
├── types/
│   ├── agents.md                ← 모든 타입/인터페이스 정의
│   └── index.ts
│
├── calc/
│   ├── agents.md                ← 순수 계산 함수 명세 + 수식 전체
│   ├── pnl.ts
│   ├── avgPrice.ts
│   ├── stopTake.ts
│   ├── breakeven.ts
│   ├── sizing.ts
│   ├── simulation.ts
│   └── expectancy.ts
│
├── store/
│   ├── agents.md                ← Zustand 스토어 설계 및 정책
│   └── useSettingsStore.ts
│
├── utils/
│   ├── agents.md                ← 포맷/검증 유틸 함수 명세
│   ├── format.ts
│   └── validate.ts
│
├── components/
│   ├── agents.md                ← 공통 UI 컴포넌트 명세 및 규칙
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── TabNav.tsx
│   ├── settings/
│   │   └── SettingsModal.tsx
│   └── ui/
│       ├── InputRow.tsx
│       ├── ResultCard.tsx
│       ├── PnlBadge.tsx
│       └── CopyButton.tsx
│
├── features/
│   ├── agents.md                ← 각 기능 페이지 구현 규칙
│   ├── avgCalc/
│   ├── dca/
│   ├── sizing/
│   ├── simulator/
│   └── expectancy/
│
├── App.tsx
├── main.tsx
└── index.css
```

---

## 3. 전역 금지 사항

| 금지 | 이유 |
|------|------|
| `class` 컴포넌트 | Hooks 사용 불가 |
| `any` 타입 | 타입 안전성 파괴 |
| `calc/` 내부에서 store import | 순수 함수 원칙 위반 |
| `useEffect`로 계산 수행 | `useMemo`로 대체할 것 |
| `localStorage` 직접 접근 (store/utils 외부) | 관리 포인트 분산 |
| 불필요한 외부 패키지 추가 | 섹션 1의 패키지 목록만 사용 |

---

## 4. 참조 문서

| 문서 | 용도 |
|------|------|
| `trading_service_spec_v1.md` | 기능 명세, 계산식, UX 정책 전체. 계산식은 반드시 이 문서를 우선 참조 |
| `design_system.md` | 공통 디자인 시스템 단일 소스. UI 구현 전 반드시 먼저 읽고 토큰/레이아웃/상태 규칙을 따른다 |

---

## 5. 라우팅 & SEO 규칙

- 기능은 탭 UI로 노출하되, 실제 렌더링은 기능별 고유 URL로 분리한다.
- 기능 경로 고정값:
  - `/avg-price`
  - `/dca`
  - `/position-sizing`
  - `/simulator`
  - `/expectancy`
- 각 경로는 고유 `title`, `description`, `canonical`을 가진다.
- 탭 컴포넌트는 state 전환 버튼이 아니라 경로 이동 링크를 사용한다.
- 배포는 SPA rewrite(`/* -> /index.html`)를 전제로 한다.
