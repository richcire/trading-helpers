import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'

import { useI18n } from '../../i18n'
import { IconButton } from '../ui/IconButton'

interface Tab {
  id: string
  label: string
  to: string
}

interface Props {
  tabs: readonly Tab[]
  docsPath: string
  docsLabel: string
  onClose: () => void
}

export function MobileSidebar({ tabs, docsPath, docsLabel, onClose }: Props) {
  const { t } = useI18n()
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      onClose()
    }
    prevPathRef.current = location.pathname
  }, [location.pathname, onClose])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.classList.add('modal-open')
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center rounded-[var(--radius-control)] px-4 py-3 text-sm font-semibold transition duration-200 ease-out',
      isActive
        ? 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]'
        : 'text-[color:var(--color-text-muted)] hover:bg-white/6 hover:text-[color:var(--color-text-primary)]',
    )

  return (
    <div className="animate-backdrop-in fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <button
        aria-label={t('header.closeMenu')}
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        type="button"
      />
      <nav className="animate-sidebar-in fixed inset-y-0 left-0 z-10 flex w-72 flex-col border-r border-[color:var(--color-border-subtle)] bg-[rgba(7,17,23,0.95)] backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[color:var(--color-text-primary)]">
            {t('header.title')}
          </h2>
          <IconButton label={t('header.closeMenu')} onClick={onClose}>
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
              <path
                d="M18 6 6 18M6 6l12 12"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </IconButton>
        </div>

        <div className="mx-4 h-px bg-gradient-to-r from-[color:var(--color-border-strong)] to-transparent" />

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
          {tabs.map((tab) => (
            <NavLink key={tab.id} className={linkClass} to={tab.to}>
              {tab.label}
            </NavLink>
          ))}

          <div className="mx-1 my-2 h-px bg-white/8" />

          <NavLink className={linkClass} to={docsPath}>
            {docsLabel}
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
