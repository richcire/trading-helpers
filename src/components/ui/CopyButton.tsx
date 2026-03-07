import { useState } from 'react'

import { ActionButton } from './ActionButton'

interface Props {
  text: string
  label?: string
  variant?: 'ghost' | 'solid'
}

export function CopyButton({ label = '복사', text, variant = 'ghost' }: Props) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setFailed(false)
      setCopied(true)
      window.setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      setCopied(false)
      setFailed(true)
      window.setTimeout(() => {
        setFailed(false)
      }, 2000)
    }
  }

  return (
    <ActionButton onClick={handleCopy} tone={failed ? 'warning' : copied ? 'profit' : 'neutral'} variant={variant}>
      {failed ? '복사 실패' : copied ? '복사됨' : label}
    </ActionButton>
  )
}
