'use client'

import dynamic from 'next/dynamic'

// Use the Porto-styled wallet with actual Porto dialog look
const PortoStyleWallet = dynamic(() => import('./PortoStyleWallet'), { 
  ssr: false,
  loading: () => null
})

export default function WalletPage() {
  return <PortoStyleWallet />
}