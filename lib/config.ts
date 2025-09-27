/**
 * Configuration for cross-domain wallet operations
 * These can be completely different domains (e.g., app.uniswap.org and wallet.liquidroute.com)
 */

export const config = {
  // Wallet identity
  walletName: process.env.NEXT_PUBLIC_WALLET_NAME || 'LiquidRoute Wallet',
  walletDescription: process.env.NEXT_PUBLIC_WALLET_DESCRIPTION || 'Secure Solana Wallet',
  
  // List of trusted origins that can interact with the wallet
  // These can be COMPLETELY DIFFERENT domains, not just subdomains
  // Production domains:
  // - https://solanavalidators.xyz (our client app)
  // - https://app.uniswap.org (partner)
  // - https://jupiter.ag (partner)
  trustedOrigins: (
    process.env.NEXT_PUBLIC_TRUSTED_ORIGINS || 
    'http://localhost:3000,http://localhost:3001,https://solanavalidators.xyz,https://swap.jupiter.ag,https://app.uniswap.org,https://app.1inch.io'
  ).split(',').map(origin => origin.trim()),
  
  // Network configuration
  defaultNetwork: process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'mainnet-beta',
  rpcEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
}

/**
 * Check if an origin is trusted
 * This determines if a domain can use our wallet
 */
export function isTrustedOrigin(origin: string): boolean {
  // Allow same origin always (for development)
  if (typeof window !== 'undefined' && origin === window.location.origin) {
    return true
  }
  
  // Check against trusted origins list
  return config.trustedOrigins.includes(origin)
}

/**
 * Get the origin from a URL or use current origin
 */
export function getOrigin(url?: string): string {
  if (url) {
    try {
      return new URL(url).origin
    } catch {
      return '*'
    }
  }
  
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  return '*'
}
