'use client'

import React from 'react'
import { StringFormatter } from '@/lib/utils/StringFormatter'

interface SwapPreviewProps {
  fromToken: {
    symbol: string
    amount: string
    icon?: string
    usdValue?: string
  }
  toToken: {
    symbol: string
    amount: string
    icon?: string
    usdValue?: string
  }
  rate: string
  priceImpact?: string
  route?: string // e.g., "Jupiter", "Raydium", "Orca"
  slippage?: string
  minimumReceived?: string
  publicKey: string
  onApprove: () => void
  onReject: () => void
  isProcessing?: boolean
  error?: string | null
}

export function SwapPreview({
  fromToken,
  toToken,
  rate,
  priceImpact = '0.01%',
  route = 'Jupiter',
  slippage = '0.5%',
  minimumReceived,
  publicKey,
  onApprove,
  onReject,
  isProcessing = false,
  error
}: SwapPreviewProps) {
  return (
    <div>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '24px'
      }}>
        {/* Swap Icon */}
        <div style={{
          width: '48px',
          height: '48px',
          margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" 
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h2 className="liquidroute-title" style={{ margin: 0 }}>
          Swap Tokens
        </h2>
        
        <p className="liquidroute-subtitle" style={{ margin: 0 }}>
          Review your swap details
        </p>
      </div>

      {/* Swap Details Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(153, 69, 255, 0.05) 0%, rgba(20, 241, 149, 0.05) 100%)',
        border: '1px solid rgba(153, 69, 255, 0.15)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        {/* From Token */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: fromToken.icon ? `url(${fromToken.icon})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              borderRadius: '50%'
            }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, opacity: 0.7 }}>You pay</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>
                {fromToken.amount} {fromToken.symbol}
              </div>
              {fromToken.usdValue && (
                <div style={{ fontSize: '12px', opacity: 0.6 }}>
                  ≈ ${fromToken.usdValue}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '16px 0'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'white',
            border: '2px solid rgba(153, 69, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M12 19l-7-7M12 19l7-7" 
                stroke="#9945FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* To Token */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: toToken.icon ? `url(${toToken.icon})` : 'linear-gradient(135deg, #14F195 0%, #9945FF 100%)',
              backgroundSize: 'cover',
              borderRadius: '50%'
            }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, opacity: 0.7 }}>You receive</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#14F195' }}>
                {toToken.amount} {toToken.symbol}
              </div>
              {toToken.usdValue && (
                <div style={{ fontSize: '12px', opacity: 0.6 }}>
                  ≈ ${toToken.usdValue}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Swap Info */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        {/* Rate */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '13px', opacity: 0.6 }}>Rate</span>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>
            1 {fromToken.symbol} = {rate} {toToken.symbol}
          </span>
        </div>

        {/* Route */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '13px', opacity: 0.6 }}>Route</span>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>
            {route} 🚀
          </span>
        </div>

        {/* Price Impact */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '13px', opacity: 0.6 }}>Price Impact</span>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 500,
            color: parseFloat(priceImpact) > 3 ? '#ef4444' : parseFloat(priceImpact) > 1 ? '#f59e0b' : '#10b981'
          }}>
            {priceImpact}
          </span>
        </div>

        {/* Slippage */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '13px', opacity: 0.6 }}>Max Slippage</span>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>
            {slippage}
          </span>
        </div>

        {/* Minimum Received */}
        {minimumReceived && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)'
          }}>
            <span style={{ fontSize: '13px', opacity: 0.6 }}>Min Received</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {minimumReceived} {toToken.symbol}
            </span>
          </div>
        )}
      </div>

      {/* High Price Impact Warning */}
      {parseFloat(priceImpact) > 3 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '20px',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '16px' }}>⚠️</span>
          <div style={{ fontSize: '12px', lineHeight: 1.4, flex: 1 }}>
            <strong>High Price Impact!</strong> This swap will significantly move the market price. 
            Consider splitting into smaller trades.
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
          Cancel
        </button>
        <button
          className="liquidroute-button primary"
          onClick={onApprove}
          disabled={isProcessing}
          style={{ 
            flex: 1,
            background: isProcessing ? 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)' : undefined
          }}
        >
          {isProcessing ? 'Swapping...' : 'Confirm Swap'}
        </button>
      </div>
    </div>
  )
}
