'use client'

import dynamic from 'next/dynamic'

// Use Porto's exact wallet UI
const PortoExactWallet = dynamic(() => import('./porto-exact-wallet'), { 
  ssr: false,
  loading: () => null
})

export default function WalletPage() {
  return <PortoExactWallet />
}