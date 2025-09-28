// Sentry integration stub for Porto compatibility
export const Sentry = {
  init: (config: any) => {
    // Stub for now - would integrate real Sentry here
    console.log('Sentry init stub', config)
  },
  captureException: (error: Error) => {
    console.error('Sentry captureException stub:', error)
  },
  setUser: (user: any) => {
    console.log('Sentry setUser stub:', user)
  },
  withScope: (callback: (scope: any) => void) => {
    // Stub
    callback({
      setTag: () => {},
      setContext: () => {},
    })
  }
}

export default Sentry