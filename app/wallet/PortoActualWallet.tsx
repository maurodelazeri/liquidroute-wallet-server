'use client'

import { useEffect, useState } from 'react'

export default function PortoActualWallet() {
  const [portoUrl, setPortoUrl] = useState('')

  useEffect(() => {
    // Determine the Porto dialog URL
    if (typeof window !== 'undefined') {
      const isProduction = window.location.hostname !== 'localhost'
      
      // In production, Porto's dialog would be built and served from /dialog path
      // In development, it runs on port 3002
      const url = isProduction 
        ? `${window.location.origin}/dialog`
        : 'http://localhost:3002'
      
      setPortoUrl(url)
    }
  }, [])

  if (!portoUrl) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'transparent'
      }}>
        <div style={{ color: '#666' }}>Loading Porto wallet...</div>
      </div>
    )
  }

  return (
    <iframe
      src={portoUrl}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        background: 'transparent'
      }}
      allow="publickey-credentials-get *; publickey-credentials-create *; clipboard-write *"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
    />
  )
}
