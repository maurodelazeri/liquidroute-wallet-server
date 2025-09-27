// Exact copy of Porto's Storage implementation
import { createStore, del, get, set } from 'idb-keyval'

export type Storage = {
  getItem: <value>(name: string) => Promise<value | null> | value | null
  removeItem: (name: string) => Promise<void> | void
  setItem: (name: string, value: unknown) => Promise<void> | void
  sizeLimit: number
  storages?: readonly Storage[] | undefined
}

export function from(storage: Storage): Storage {
  return storage
}

export function combine(...storages: readonly Storage[]): Storage {
  return {
    async getItem<value>(name: string) {
      const results = await Promise.allSettled(
        storages.map((x) => x.getItem(name)),
      )
      const result = results.find(
        (x) => x.status === 'fulfilled' && x.value !== null,
      )
      if (result?.status !== 'fulfilled') return null
      if (result.value === null) return null
      return result.value as value
    },
    async removeItem(name) {
      await Promise.allSettled(storages.map((x) => x.removeItem(name)))
    },
    async setItem(name, value) {
      await Promise.allSettled(storages.map((x) => x.setItem(name, value)))
    },
    sizeLimit: Math.min(...storages.map((x) => x.sizeLimit)),
    storages,
  }
}

// IndexedDB storage (primary)
export function idb() {
  const store =
    typeof indexedDB !== 'undefined' ? createStore('liquidroute', 'store') : undefined
  return from({
    async getItem(name) {
      if (!store) return null
      const value = await get(name, store)
      if (value === null) return null
      return value
    },
    async removeItem(name) {
      if (!store) return
      await del(name, store)
    },
    async setItem(name, value) {
      if (!store) return
      // Remove functions and other non-serializable values
      const normalized = JSON.parse(JSON.stringify(value))
      await set(name, normalized, store)
    },
    sizeLimit: 1024 * 1024 * 50, // ≈50MB
  })
}

// LocalStorage fallback
export function localStorage() {
  return from({
    getItem(name) {
      if (typeof window === 'undefined') return null
      const item = window.localStorage.getItem(name)
      if (item === null) return null
      try {
        return JSON.parse(item)
      } catch {
        return null
      }
    },
    removeItem(name) {
      if (typeof window === 'undefined') return
      window.localStorage.removeItem(name)
    },
    setItem(name, value) {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(name, JSON.stringify(value))
    },
    sizeLimit: 1024 * 1024 * 5, // ≈5MB
  })
}

// Memory storage (for SSR)
export function memory() {
  const store = new Map<string, any>()
  return from({
    getItem(name) {
      return store.get(name) ?? null
    },
    removeItem(name) {
      store.delete(name)
    },
    setItem(name, value) {
      store.set(name, value)
    },
    sizeLimit: Number.POSITIVE_INFINITY,
  })
}
