'use client'

import dynamic from 'next/dynamic'

// Use Porto's exact Dialog UI
const PortoDialog = dynamic(() => import('./PortoExactDialog'), { 
  ssr: false,
  loading: () => null
})

export default function WalletPage() {
  return <PortoDialog />
}