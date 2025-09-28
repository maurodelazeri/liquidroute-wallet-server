'use client'

import dynamic from 'next/dynamic'

// THE COMPLETE PORTO - ALL OF IT
const PortoComplete = dynamic(() => import('./PortoComplete'), { 
  ssr: false,
  loading: () => null
})

export default function WalletPage() {
  return <PortoComplete />
}