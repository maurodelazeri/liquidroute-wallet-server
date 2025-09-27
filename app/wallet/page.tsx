'use client'

import dynamic from 'next/dynamic'

// Disable SSR for the wallet UI since it needs window access
const PortoWalletUI = dynamic(() => import('./porto-wallet-ui'), { 
  ssr: false,
  loading: () => null
})

export default function WalletPage() {
  return <PortoWalletUI />
}