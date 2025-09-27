'use client'

import React from 'react'

interface PaymentPreviewProps {
  merchant: {
    name: string
    logo?: string
    verified?: boolean
    website?: string
  }
  items?: {
    name: string
    quantity: number
    price: string
    image?: string
  }[]
  summary: {
    subtotal: string
    tax?: string
    shipping?: string
    discount?: string
    total: string
    currency: string
    usdValue?: string
  }
  shippingAddress?: {
    name?: string
    address?: string
    city?: string
    country?: string
  }
  publicKey: string
  onApprove: () => void
  onReject: () => void
  isProcessing?: boolean
  error?: string | null
}

export function PaymentPreview({
  merchant,
  items,
  summary,
  shippingAddress,
  publicKey,
  onApprove,
  onReject,
  isProcessing = false,
  error
}: PaymentPreviewProps) {
  const formatAddress = (address: string) => {
    if (address.length <= 16) return address
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  return (
    <div className="porto-screen">
      {/* Porto Header */}
      <div className="porto-header">
        <div className="porto-header-default">
          {/* Merchant Info */}
          <div className="porto-merchant">
            <div className="porto-merchant-logo">
              {merchant.logo ? (
                <img src={merchant.logo} alt={merchant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2M8 21v-5m8 5v-5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </div>
            <div className="porto-merchant-info">
              <div className="porto-merchant-name">
                {merchant.name}
                {merchant.verified && (
                  <svg className="porto-merchant-verified" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="10" fill="currentColor"/>
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              {merchant.website && (
                <div className="porto-merchant-url">{merchant.website}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Porto Content */}
      <div className="porto-content">
        {/* Order Items */}
        {items && items.length > 0 && (
          <div className="porto-details">
            <div className="porto-details-title">Order Details</div>
            {items.map((item, i) => (
              <div key={i} className="porto-details-row">
                <div className="porto-details-label">
                  {item.name}
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>Qty: {item.quantity}</div>
                </div>
                <div className="porto-details-value">
                  {item.price} {summary.currency}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment Summary */}
        <div className="porto-summary">
          <div className="porto-details-title">Payment Summary</div>
          
          <div className="porto-summary-row">
            <div className="porto-summary-label">Subtotal</div>
            <div className="porto-summary-value">{summary.subtotal} {summary.currency}</div>
          </div>
          
          {summary.tax && (
            <div className="porto-summary-row">
              <div className="porto-summary-label">Tax</div>
              <div className="porto-summary-value">{summary.tax} {summary.currency}</div>
            </div>
          )}
          
          {summary.shipping && (
            <div className="porto-summary-row">
              <div className="porto-summary-label">Shipping</div>
              <div className="porto-summary-value">{summary.shipping} {summary.currency}</div>
            </div>
          )}
          
          {summary.discount && (
            <div className="porto-summary-row">
              <div className="porto-summary-label">Discount</div>
              <div className="porto-summary-value" style={{ color: 'var(--text-color-th_base-positive)' }}>
                -{summary.discount} {summary.currency}
              </div>
            </div>
          )}
          
          <div className="porto-summary-row total">
            <div className="porto-summary-label">Total</div>
            <div className="porto-summary-value">
              {summary.total} {summary.currency}
              {summary.usdValue && (
                <div className="porto-summary-value-sub">≈ ${summary.usdValue}</div>
              )}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {shippingAddress && (
          <div className="porto-details">
            <div className="porto-details-title">Shipping to</div>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {shippingAddress.name && <div>{shippingAddress.name}</div>}
              {shippingAddress.address && <div>{shippingAddress.address}</div>}
              {(shippingAddress.city || shippingAddress.country) && (
                <div>
                  {shippingAddress.city}
                  {shippingAddress.city && shippingAddress.country && ', '}
                  {shippingAddress.country}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="porto-alert positive">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1l9 4v6c0 5.5-3.8 10.7-9 12-5.2-1.3-9-6.5-9-12V5l9-4z"/>
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <strong>Secure Payment</strong><br/>
            Your payment is processed securely through the Solana blockchain.
            {merchant.verified && ' This merchant is verified and trusted.'}
          </div>
        </div>

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
            Cancel
          </button>
          <button
            className="porto-button primary"
            onClick={onApprove}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : `Pay ${summary.total} ${summary.currency}`}
          </button>
        </div>
      </div>
    </div>
  )
}
