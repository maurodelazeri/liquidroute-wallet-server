'use client'

import React from 'react'

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
  const formatAddress = (address: string) => {
    if (!address) return ''
    if (address.length <= 16) return address
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }
  
  const getTitle = () => {
    switch(method) {
      case 'connect': return 'Connect Wallet'
      case 'signMessage': return 'Sign Message'
      case 'signTransaction': return 'Sign Transaction'
      case 'sendTransaction': return 'Send Transaction'
      default: return 'Approve Action'
    }
  }

  const getSubtitle = () => {
    return 'Review and approve this action'
  }

  return (
    <div className="porto-screen">
      {/* Porto Header */}
      <div className="porto-header">
        <div className="porto-header-default">
          <div className="porto-header-title-group">
            {method === 'signMessage' && (
              <div className="porto-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                </svg>
              </div>
            )}
            <div className="porto-header-title">{getTitle()}</div>
          </div>
          <div className="porto-header-content">
            <div className="porto-header-content-sub">{getSubtitle()}</div>
          </div>
        </div>
      </div>

      {/* Porto Content */}
      <div className="porto-content">
        {/* Details Section */}
        <div className="porto-details">
          {/* From Address */}
          {from && (
            <div className="porto-details-row">
              <div className="porto-details-label">From</div>
              <div className="porto-details-value monospace">{formatAddress(from)}</div>
            </div>
          )}
          
          {/* To Address */}
          {to && (
            <div className="porto-details-row">
              <div className="porto-details-label">To</div>
              <div className="porto-details-value monospace">{formatAddress(to)}</div>
            </div>
          )}
          
          {/* Network */}
          <div className="porto-details-row">
            <div className="porto-details-label">Network</div>
            <div className="porto-details-value">
              <div className="porto-network">
                <span className="porto-network-dot"></span>
                Solana Mainnet
              </div>
            </div>
          </div>
          
          {/* Est. Fee */}
          <div className="porto-details-row">
            <div className="porto-details-label">Est. Fee</div>
            <div className="porto-details-value">~0.000005 SOL</div>
          </div>
        </div>

        {/* Message Content */}
        {message && (
          <div className="porto-details">
            <div className="porto-details-title">Message to Sign</div>
            <div style={{
              padding: '12px',
              background: 'var(--background-color-th_base)',
              borderRadius: 'var(--radius-th_small)',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.5',
              color: 'var(--text-color-th_base)',
              wordBreak: 'break-word',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {message.length > 500 ? `${message.substring(0, 500)}...` : message}
            </div>
          </div>
        )}

        {/* Warning for signing */}
        {(method === 'signMessage' || method === 'signTransaction') && (
          <div className="porto-alert warning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 19h20L12 2zm0 4l7.5 11h-15L12 6z"/>
              <path d="M12 10v4m0 2h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div style={{ flex: 1 }}>
              Only sign messages from trusted sources. This action cannot be undone.
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="porto-alert negative">
            {error}
          </div>
        )}
      </div>

      {/* Porto Footer */}
      <div className="porto-footer">
        <div className="porto-footer-actions">
          <button
            className="porto-button secondary"
            onClick={onReject}
            disabled={isProcessing}
          >
            Reject
          </button>
          <button
            className="porto-button primary"
            onClick={onApprove}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}
