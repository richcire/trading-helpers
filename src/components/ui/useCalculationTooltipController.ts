import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'

export interface TooltipGroupContextValue {
  openId: string | null
  setOpenId: (id: string | null) => void
}

export const TooltipGroupContext = createContext<TooltipGroupContextValue | null>(null)

interface TooltipController {
  isOpen: boolean
  panelId: string
  rootRef: React.RefObject<HTMLDivElement | null>
  open: () => void
  close: () => void
  toggle: () => void
}

export function useCalculationTooltipController(): TooltipController {
  const context = useContext(TooltipGroupContext)
  const [localOpen, setLocalOpen] = useState(false)
  const id = useId()
  const panelId = `${id}-calculation-tooltip`
  const rootRef = useRef<HTMLDivElement>(null)

  const isOpen = context ? context.openId === id : localOpen

  const open = useCallback(() => {
    if (context) {
      context.setOpenId(id)
      return
    }

    setLocalOpen(true)
  }, [context, id])

  const close = useCallback(() => {
    if (context) {
      if (context.openId === id) {
        context.setOpenId(null)
      }
      return
    }

    setLocalOpen(false)
  }, [context, id])

  const toggle = useCallback(() => {
    if (isOpen) {
      close()
      return
    }

    open()
  }, [close, isOpen, open])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current) {
        return
      }

      const target = event.target as Node | null
      if (target && !rootRef.current.contains(target)) {
        close()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [close, isOpen])

  return {
    isOpen,
    panelId,
    rootRef,
    open,
    close,
    toggle,
  }
}
