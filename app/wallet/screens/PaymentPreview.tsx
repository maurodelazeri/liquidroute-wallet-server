'use client'

import React from 'react'
import { StringFormatter } from '@/lib/utils/StringFormatter'

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
    currency: string // SOL, USDC, etc
    usdValue?: string
  }
  paymentMethod?: {
    type: 'wallet' | 'token'
    name: string
    icon?: string
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
  paymentMethod,
  shippingAddress,
  publicKey,
  onApprove,
  onReject,
  isProcessing = false,
  error
}: PaymentPreviewProps) {
  return (
    <div>
      {/* Merchant Header */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: merchant.logo ? `url(${merchant.logo})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px'
          }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 600,
              margin: 0
            }}>
              {merchant.name}
            </h2>
            {merchant.verified && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#14F195"/>
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          {merchant.website && (
            <p style={{ 
              fontSize: '13px', 
              opacity: 0.6, 
              margin: '4px 0 0 0' 
            }}>
              {merchant.website}
            </p>
          )}
        </div>
      </div>

      {/* Order Items */}
      {items && items.length > 0 && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '12px'
          }}>
            Order Details
          </div>
          
          {items.map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '12px',
              marginBottom: i < items.length - 1 ? '12px' : '0'
            }}>
              {item.image && (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  background: `url(${item.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  flexShrink: 0
                }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '4px'
                }}>
                  {item.name}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', opacity: 0.6 }}>
                    Qty: {item.quantity}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>
                    {item.price} {summary.currency}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Summary */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(153, 69, 255, 0.05) 0%, rgba(20, 241, 149, 0.05) 100%)',
        border: '1px solid rgba(153, 69, 255, 0.15)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '12px'
        }}>
          Payment Summary
        </div>

        {/* Subtotal */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '13px', opacity: 0.7 }}>Subtotal</span>
          <span style={{ fontSize: '13px' }}>
            {summary.subtotal} {summary.currency}
          </span>
        </div>

        {/* Tax */}
        {summary.tax && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>Tax</span>
            <span style={{ fontSize: '13px' }}>
              {summary.tax} {summary.currency}
            </span>
          </div>
        )}

        {/* Shipping */}
        {summary.shipping && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>Shipping</span>
            <span style={{ fontSize: '13px' }}>
              {summary.shipping} {summary.currency}
            </span>
          </div>
        )}

        {/* Discount */}
        {summary.discount && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>Discount</span>
            <span style={{ fontSize: '13px', color: '#10b981' }}>
              -{summary.discount} {summary.currency}
            </span>
          </div>
        )}

        {/* Total */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Total</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#9945FF' }}>
              {summary.total} {summary.currency}
            </div>
            {summary.usdValue && (
              <div style={{ fontSize: '12px', opacity: 0.6 }}>
                ≈ ${summary.usdValue}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {shippingAddress && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '8px',
            opacity: 0.7
          }}>
            Shipping to
          </div>
          <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
            {shippingAddress.name && <div>{shippingAddress.name}</div>}
            {shippingAddress.address && <div>{shippingAddress.address}</div>}
            {(shippingAddress.city || shippingAddress.country) && (
              <div>
                {shippingAddress.city}{shippingAddress.city && shippingAddress.country && ', '}{shippingAddress.country}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div style={{
        background: 'rgba(20, 241, 149, 0.08)',
        border: '1px solid rgba(20, 241, 149, 0.3)',
        borderRadius: '8px',
        padding: '10px 12px',
        marginBottom: '20px',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: '16px' }}>🔒</span>
        <div style={{ fontSize: '12px', lineHeight: 1.4, flex: 1 }}>
          <strong>Secure Payment</strong><br/>
          Your payment is processed securely through the Solana blockchain. 
          {merchant.verified && ' This merchant is verified and trusted.'}
        </div>
      </div>

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
          Cancel
        </button>
        <button
          className="liquidroute-button primary"
          onClick={onApprove}
          disabled={isProcessing}
          style={{ 
            flex: 1,
            background: isProcessing ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined
          }}
        >
          {isProcessing ? 'Processing...' : `Pay ${summary.total} ${summary.currency}`}
        </button>
      </div>
    </div>
  )
}
