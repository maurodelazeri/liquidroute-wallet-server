'use client'

import dynamic from 'next/dynamic'

// Use our simplified Porto-style wallet UI
const PortoWallet = dynamic(() => import('./PortoWallet'), { 
  ssr: false,
  loading: () => null
})

export default function WalletPage() {
  return <PortoWallet />
}