import clsx from 'clsx'
import { NavLink } from 'react-router-dom'

interface Tab<T extends string> {
  id: T
  label: string
  to: string
}

interface Props<T extends string> {
  tabs: readonly Tab<T>[]
}

export function TabNav<T extends string>({ tabs }: Props<T>) {
  return (
    <nav className="px-4 pb-3 pt-2 sm:px-6">
      <div className="scrollbar-hidden flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          return (
            <NavLink
              key={tab.id}
              className={({ isActive }) =>
                clsx(
                  'relative flex min-h-11 shrink-0 items-center rounded-[var(--radius-pill)] border px-4 py-2 text-sm font-semibold tracking-[-0.01em] transition duration-200 ease-out focus-visible:outline-none',
                  isActive
                    ? 'border-[rgba(82,199,222,0.3)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]'
                    : 'border-transparent bg-transparent text-[color:var(--color-text-muted)] hover:bg-white/6 hover:text-[color:var(--color-text-primary)]',
                )
              }
              to={tab.to}
            >
              {({ isActive }) => (
                <>
                  <span>{tab.label}</span>
                  <span
                    className={clsx(
                      'absolute inset-x-3 bottom-1 h-px rounded-full transition duration-200',
                      isActive ? 'bg-[color:var(--color-accent)] opacity-100' : 'bg-transparent opacity-0',
                    )}
                  />
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
