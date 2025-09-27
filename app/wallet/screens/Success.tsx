'use client'

import React from 'react'

interface SuccessProps {
  title?: string
  message?: string
  txHash?: string
  onClose?: () => void
}

export function Success({ 
  title = 'Success!', 
  message = 'Transaction completed successfully',
  txHash,
  onClose 
}: SuccessProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    if (!txHash) return
    try {
      await navigator.clipboard.writeText(txHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy hash:', err)
    }
  }

  // Auto close after 3 seconds if onClose is provided
  React.useEffect(() => {
    if (onClose) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [onClose])

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    }}>
      {/* Success Icon */}
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #14F195 0%, #9945FF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}>
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <path 
            d="M5 13l4 4L19 7" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Title */}
      <h2 className="liquidroute-title" style={{ margin: 0 }}>
        {title}
      </h2>

      {/* Message */}
      <p className="liquidroute-subtitle" style={{ margin: 0 }}>
        {message}
      </p>

      {/* Transaction Hash */}
      {txHash && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '8px',
          padding: '12px',
          width: '100%',
          maxWidth: '320px'
        }}>
          <div style={{
            fontSize: '11px',
            opacity: 0.6,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Transaction Hash
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {txHash.slice(0, 12)}...{txHash.slice(-8)}
            </div>
            <button
              onClick={handleCopy}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                background: 'rgba(0, 144, 255, 0.1)',
                border: '1px solid rgba(0, 144, 255, 0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#0090ff',
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }}
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Explorer Link */}
      {txHash && (
        <a
          href={`https://solscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '13px',
            color: '#0090ff',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 500
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none'
          }}
        >
          View on Explorer
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path 
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </a>
      )}

      {/* Add animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  )
}
