import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

export const client: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnReconnect: () => !client.isMutating(),
      retry: 0,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') return
      console.error(error)
    },
  }),
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') return
      if (query.state.data !== undefined) console.error(error)
    },
  }),
})

export const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
})

// Export as namespace for compatibility
export const Query = {
  client,
  persister
}