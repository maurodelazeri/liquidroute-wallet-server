// Exact copy of Porto's Dialog store implementation
import * as Zustand from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/shallow'
import { createStore } from 'zustand/vanilla'
import * as Storage from './Storage'

// Create storage adapter for Zustand exactly like Porto
function createStorage() {
  if (typeof window === 'undefined') {
    // Server-side: use memory storage
    const memStorage = Storage.memory()
    return {
      getItem: async (name: string) => {
        const value = await memStorage.getItem<string>(name)
        return value ? JSON.parse(value) : null
      },
      setItem: async (name: string, value: any) => {
        await memStorage.setItem(name, JSON.stringify(value))
      },
      removeItem: async (name: string) => {
        await memStorage.removeItem(name)
      }
    }
  }
  
  // Client-side: Combine IndexedDB and localStorage for persistence
  const combined = Storage.combine(
    Storage.idb(),
    Storage.localStorage()
  )
  
  return {
    getItem: async (name: string) => {
      try {
        const value = await combined.getItem<string>(name)
        return value ? JSON.parse(value) : null
      } catch {
        return null
      }
    },
    setItem: async (name: string, value: any) => {
      await combined.setItem(name, JSON.stringify(value))
    },
    removeItem: async (name: string) => {
      await combined.removeItem(name)
    }
  }
}

export const store = createStore(
  devtools(
    persist<store.State>(
      () => ({
        accountMetadata: {},
        accounts: [],
        display: 'full',
        error: null,
        mode: 'popup-standalone',
        referrer: undefined,
      }),
      {
        name: 'liquidroute.dialog',
        partialize(state) {
          // Only persist account-related data
          return {
            accountMetadata: state.accountMetadata,
            accounts: state.accounts,
          } as store.State
        },
        // Use combined storage exactly like Porto
        storage: createStorage(),
        version: 1,
      },
    ),
  ),
)

export declare namespace store {
  type State = {
    accountMetadata: Record<
      string, // wallet address
      {
        credentialId?: string | undefined
        lastUsed?: number | undefined
      }
    >
    accounts: Array<{
      address: string
      credentialId: string
    }>
    // reflects how the dialog window gets displayed:
    // - 'full': uses the full space available (popup, popup-standalone) (default)
    // - 'floating': as a floating window, with space around it (iframe)
    // - 'drawer': as a drawer (iframe with small viewports)
    display: 'floating' | 'drawer' | 'full'
    error: {
      action: 'close' | 'retry'
      message: string
      name: string
      secondaryMessage?: string
      title: string
    } | null
    mode: 'iframe' | 'popup' | 'popup-standalone'
    referrer: {
      origin: string
      url?: URL | undefined
      title?: string | undefined
    } | undefined
  }
}

// Hook for React components, exactly like Porto
export function useStore<slice = store.State>(
  selector: Parameters<typeof Zustand.useStore<typeof store, slice>>[1] = (
    state,
  ) => state as slice,
) {
  return Zustand.useStore(store, useShallow(selector))
}
