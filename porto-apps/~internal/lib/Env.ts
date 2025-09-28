export type Environment = 'development' | 'production' | 'preview'

export function get(): Environment {
  if (typeof window === 'undefined') return 'development'
  
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development'
  }
  if (hostname.includes('vercel.app')) {
    return 'preview'
  }
  return 'production'
}

export function isDevelopment(): boolean {
  return get() === 'development'
}

export function isProduction(): boolean {
  return get() === 'production'
}

export function isPreview(): boolean {
  return get() === 'preview'
}

// Export as namespace
export const Env = {
  get,
  isDevelopment,
  isProduction,
  isPreview
}