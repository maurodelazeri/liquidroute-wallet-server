'use client'

import React from 'react'
import { StringFormatter } from '@/lib/utils/StringFormatter'

interface InsufficientFundsProps {
  publicKey: string
  requiredAmount?: string // Amount of SOL needed
  onCancel: () => void
  onAddFunds: () => void
  onCopyAddress?: () => void
}

export function InsufficientFunds({ 
  publicKey, 
  requiredAmount,
  onCancel, 
  onAddFunds,
  onCopyAddress
}: InsufficientFundsProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicKey)
      setCopied(true)
      onCopyAddress?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Blue diamond icon similar to Porto */}
        <div style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #0090ff 0%, #0070cc 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'rotate(45deg)'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'white',
            borderRadius: '4px'
          }} />
        </div>
        
        <h2 className="liquidroute-title" style={{ margin: 0 }}>
          Insufficient funds
        </h2>
        
        <p className="liquidroute-subtitle" style={{ margin: 0 }}>
          This action requires funds to be added to your account before being able to proceed.
        </p>
      </div>

      {/* Info Box */}
      <div style={{
        background: 'rgba(0, 144, 255, 0.08)',
        border: '1px solid rgba(0, 144, 255, 0.2)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span className="liquidroute-text-small" style={{ 
            opacity: 0.7,
            fontSize: '13px'
          }}>
            Network
          </span>
          <span className="liquidroute-text-small" style={{
            fontWeight: 500,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#14F195',
              display: 'inline-block'
            }} />
            Solana Mainnet
          </span>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span className="liquidroute-text-small" style={{ 
            opacity: 0.7,
            fontSize: '13px'
          }}>
            You need
          </span>
          <span className="liquidroute-text-small" style={{
            fontWeight: 600,
            fontSize: '16px',
            color: '#ef4444'
          }}>
            {requiredAmount || '0.0001'} SOL
          </span>
        </div>
      </div>

      {/* Deposit Section */}
      <div style={{
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '4px'
            }}>
              Deposit crypto
            </div>
            <div style={{
              fontSize: '12px',
              opacity: 0.6
            }}>
              Send SOL to your wallet address
            </div>
          </div>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
            borderRadius: '50%'
          }} />
        </div>

        {/* Address with QR code placeholder */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          {/* QR Code placeholder */}
          <div style={{
            width: '64px',
            height: '64px',
            background: 'white',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: `repeating-linear-gradient(
                45deg,
                #000,
                #000 2px,
                #fff 2px,
                #fff 4px
              )`,
              opacity: 0.2
            }} />
          </div>

          {/* Address */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '11px',
              opacity: 0.6,
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Wallet Address
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              wordBreak: 'break-all',
              lineHeight: 1.4
            }}>
              {publicKey}
            </div>
            <button
              onClick={handleCopy}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                fontSize: '12px',
                background: 'rgba(0, 144, 255, 0.1)',
                border: '1px solid rgba(0, 144, 255, 0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#0090ff',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 144, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 144, 255, 0.1)'
              }}
            >
              {copied ? '✓ Copied!' : 'Copy address'}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          className="liquidroute-button secondary"
          onClick={onCancel}
          style={{ flex: 1 }}
        >
          Cancel
        </button>
        <button
          className="liquidroute-button primary"
          onClick={onAddFunds}
          style={{ flex: 1 }}
        >
          I've added funds
        </button>
      </div>
    </div>
  )
}
