import clsx from 'clsx'

interface Props {
  children?: string
  className?: string
}

export function FieldHint({ children, className }: Props) {
  if (!children) {
    return null
  }

  return <p className={clsx('text-xs leading-5 text-[color:var(--color-text-muted)]', className)}>{children}</p>
}
