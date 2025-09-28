'use client'

import dynamic from 'next/dynamic'

// For now, use our simplified Porto-style wallet
// Full Porto integration requires complex build setup
const PortoWallet = dynamic(() => import('./PortoWallet'), { 
  ssr: false,
  loading: () => null
})

export default function WalletPage() {
  return <PortoWallet />
}