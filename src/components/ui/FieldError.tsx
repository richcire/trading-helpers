interface Props {
  children?: string
}

export function FieldError({ children }: Props) {
  if (!children) {
    return null
  }

  return <p className="text-xs font-medium leading-5 text-[color:var(--color-loss)]">{children}</p>
}
