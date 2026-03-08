import { IconButton } from '../ui/IconButton'
import { StatusDot } from '../ui/StatusDot'
import { useI18n } from '../../i18n'
import { NavLink } from 'react-router-dom'

interface Props {
  onSettingsClick: () => void
  docsPath: string
  docsLabel: string
}

export function Header({ docsLabel, docsPath, onSettingsClick }: Props) {
  const { t } = useI18n()

  return (
    <header className="px-4 py-4 sm:px-6">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <StatusDot tone="accent" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
              {t('header.kicker')}
            </p>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.04em] text-[color:var(--color-text-primary)] sm:text-2xl">
              {t('header.title')}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            className={({ isActive }) =>
              isActive
                ? 'inline-flex min-h-10 items-center rounded-[var(--radius-pill)] border border-[rgba(82,199,222,0.3)] bg-[color:var(--color-accent-soft)] px-3 text-sm font-semibold text-[color:var(--color-accent)] transition duration-200 ease-out'
                : 'inline-flex min-h-10 items-center rounded-[var(--radius-pill)] border border-transparent px-3 text-sm font-semibold text-[color:var(--color-text-muted)] transition duration-200 ease-out hover:bg-white/6 hover:text-[color:var(--color-text-primary)]'
            }
            to={docsPath}
          >
            {docsLabel}
          </NavLink>
          <IconButton label={t('header.openSettings')} onClick={onSettingsClick}>
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
      </div>
    </header>
  )
}
