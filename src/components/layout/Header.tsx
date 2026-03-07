import { IconButton } from '../ui/IconButton'
import { StatusDot } from '../ui/StatusDot'

interface Props {
  onSettingsClick: () => void
}

export function Header({ onSettingsClick }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[rgba(7,17,23,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[var(--container-wide)] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <StatusDot tone="accent" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
              Trading Desk Toolkit
            </p>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.04em] text-[color:var(--color-text-primary)] sm:text-2xl">
              트레이딩 헬퍼
            </h1>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              반복 계산을 줄이고 손익 판단을 더 빠르게 만드는 공통 워크스페이스
            </p>
          </div>
        </div>
        <IconButton label="전역 설정 열기" onClick={onSettingsClick}>
          <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
            <path
              d="M10.5 4.5h3M4.5 12h15M7.5 19.5h9m-9-15v3m9 9v3M8 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm11 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-6-7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 15a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </IconButton>
      </div>
    </header>
  )
}
