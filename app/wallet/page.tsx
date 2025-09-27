'use client'

import dynamic from 'next/dynamic'

// Porto's EXACT code - copied directly from Porto's source
const PortoExactClean = dynamic(() => import('./PortoExactClean'), { 
  ssr: false,
  loading: () => null
})

export default function WalletPage() {
  return <PortoExactClean />
}