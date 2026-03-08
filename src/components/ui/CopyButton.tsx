import { useState } from 'react'

import { useI18n } from '../../i18n'
import { ActionButton } from './ActionButton'

interface Props {
  text: string
  label?: string
  variant?: 'ghost' | 'solid'
}

export function CopyButton({ label, text, variant = 'ghost' }: Props) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const { t } = useI18n()

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
      {failed ? t('copy.failed') : copied ? t('copy.copied') : label ?? t('copy.default')}
    </ActionButton>
  )
}
