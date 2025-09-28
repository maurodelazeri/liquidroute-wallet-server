'use client'

import dynamic from 'next/dynamic'

// Use Porto's ACTUAL dialog app UI - not an imitation
const PortoActualWallet = dynamic(() => import('./PortoActualWallet'), { 
  ssr: false,
  loading: () => null
})

export default function WalletPage() {
  return <PortoActualWallet />
}