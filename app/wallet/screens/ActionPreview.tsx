'use client'

import React from 'react'
import { StringFormatter } from '@/lib/utils/StringFormatter'

interface ActionPreviewProps {
  method: string
  from: string
  to?: string
  value?: string
  message?: string
  onApprove: () => void
  onReject: () => void
  error?: string | null
  isProcessing?: boolean
}

export function ActionPreview({
  method,
  from,
  to,
  value,
  message,
  onApprove,
  onReject,
  error,
  isProcessing = false
}: ActionPreviewProps) {
  return (
    <div>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '24px'
      }}>
        <h2 className="liquidroute-title">
          {method === 'connect' && 'Connect Wallet'}
          {method === 'signMessage' && 'Sign Message'}
          {method === 'signTransaction' && 'Sign Transaction'}
          {method === 'sendTransaction' && 'Send Transaction'}
        </h2>
        <p className="liquidroute-subtitle">
          Review and approve this action
        </p>
      </div>

      {/* Details Section */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        {/* From */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
        }}>
          <span style={{ 
            fontSize: '13px',
            opacity: 0.6,
            fontWeight: 500
          }}>
            From
          </span>
          <span style={{
            fontSize: '14px',
            fontFamily: 'monospace',
            fontWeight: 500
          }}>
            {StringFormatter.truncate(from, { start: 8, end: 6 })}
          </span>
        </div>

        {/* To (if applicable) */}
        {to && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
          }}>
            <span style={{ 
              fontSize: '13px',
              opacity: 0.6,
              fontWeight: 500
            }}>
              To
            </span>
            <span style={{
              fontSize: '14px',
              fontFamily: 'monospace',
              fontWeight: 500
            }}>
              {StringFormatter.truncate(to, { start: 8, end: 6 })}
            </span>
          </div>
        )}

        {/* Amount (if applicable) */}
        {value && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
          }}>
            <span style={{ 
              fontSize: '13px',
              opacity: 0.6,
              fontWeight: 500
            }}>
              Amount
            </span>
            <span style={{
              fontSize: '16px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {value}
              <span style={{
                fontSize: '14px',
                opacity: 0.7,
                fontWeight: 500
              }}>
                SOL
              </span>
            </span>
          </div>
        )}

        {/* Network */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px'
        }}>
          <span style={{ 
            fontSize: '13px',
            opacity: 0.6,
            fontWeight: 500
          }}>
            Network
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
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

        {/* Estimated Fee */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px'
        }}>
          <span style={{ 
            fontSize: '13px',
            opacity: 0.6,
            fontWeight: 500
          }}>
            Est. Fee
          </span>
          <span style={{
            fontSize: '13px',
            fontWeight: 500,
            opacity: 0.8
          }}>
            ~0.000005 SOL
          </span>
        </div>
      </div>

      {/* Message Preview (for signMessage) */}
      {message && method === 'signMessage' && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '12px',
            opacity: 0.6,
            marginBottom: '8px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Message to Sign
          </div>
          <div style={{
            fontSize: '14px',
            lineHeight: 1.5,
            wordBreak: 'break-word',
            fontFamily: 'monospace',
            color: 'rgba(0, 0, 0, 0.8)'
          }}>
            {message}
          </div>
        </div>
      )}

      {/* Risk Warning */}
      {(method === 'signTransaction' || method === 'sendTransaction') && (
        <div style={{
          background: 'rgba(255, 193, 7, 0.08)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '20px',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start'
        }}>
          <span style={{
            fontSize: '16px',
            lineHeight: 1
          }}>
            ⚠️
          </span>
          <div style={{
            fontSize: '12px',
            lineHeight: 1.4,
            flex: 1
          }}>
            <strong>Security Notice:</strong> Only approve transactions from trusted applications. 
            This action cannot be undone.
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <p style={{ 
            color: '#ef4444',
            margin: 0,
            fontSize: '14px',
            fontWeight: 500
          }}>
            {error}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          className="liquidroute-button secondary"
          onClick={onReject}
          disabled={isProcessing}
          style={{ flex: 1 }}
        >
          Reject
        </button>
        <button
          className="liquidroute-button primary"
          onClick={onApprove}
          disabled={isProcessing}
          style={{ flex: 1 }}
        >
          {isProcessing ? 'Processing...' : error ? 'Retry' : 'Approve'}
        </button>
      </div>
    </div>
  )
}
