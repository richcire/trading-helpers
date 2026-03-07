import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { CURRENCY_CODES, type CurrencyCode, type Settings } from '../types'

export const DEFAULT_SETTINGS: Settings = {
  currency: 'USD',
  leverage: 1,
  feeEntryPct: 0,
  feeExitPct: 0,
  includeFeesInPnL: true,
  adjustStopTakePriceForFees: false,
}

interface SettingsStore {
  settings: Settings
  setSettings: (patch: Partial<Settings>) => void
  resetSettings: () => void
}

const currencyCodeSet = new Set<CurrencyCode>(CURRENCY_CODES)

function normalizeSettings(settings?: Partial<Settings>): Settings {
  const next = { ...DEFAULT_SETTINGS, ...settings }

  if (!currencyCodeSet.has(next.currency)) {
    next.currency = DEFAULT_SETTINGS.currency
  }

  if (next.adjustStopTakePriceForFees) {
    next.includeFeesInPnL = true
  }

  return next
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      setSettings: (patch) =>
        set((state) => {
          return { settings: normalizeSettings({ ...state.settings, ...patch }) }
        }),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'trading-settings',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SettingsStore> | undefined
        return {
          ...currentState,
          settings: normalizeSettings(persisted?.settings),
        }
      },
    },
  ),
)
