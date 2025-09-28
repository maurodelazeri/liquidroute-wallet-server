'use client'

import dynamic from 'next/dynamic'

// Use the complete Porto-based wallet with real Porto components
const PortoCompleteWallet = dynamic(() => import('./PortoCompleteWallet'), { 
  ssr: false,
  loading: () => null
})

export default function WalletPage() {
  return <PortoCompleteWallet />
}