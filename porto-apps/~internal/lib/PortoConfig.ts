export interface Config {
  walletName: string
  walletUrl: string
  trustedOrigins: string[]
  rpcUrl: string
}

export function get(): Config {
  return {
    walletName: 'LiquidRoute Wallet',
    walletUrl: typeof window !== 'undefined' ? window.location.origin : 'https://wallet.liquidroute.com',
    trustedOrigins: [
      'https://solanavalidators.xyz',
      'https://wallet.liquidroute.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    rpcUrl: 'https://sparkling-attentive-replica.solana-mainnet.quiknode.pro/b83cf5c147d67a45906264e195574aa2a0150568/'
  }
}

export const PortoConfig = {
  get
}