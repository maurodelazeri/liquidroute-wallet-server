'use client'

import React from 'react'
import { StringFormatter } from '@/lib/utils/StringFormatter'

interface NFTMintPreviewProps {
  collection: {
    name: string
    image?: string
    creator?: string
    verified?: boolean
  }
  nft: {
    name: string
    image: string
    description?: string
    attributes?: { trait: string; value: string }[]
    rarity?: string
  }
  price: {
    amount: string
    currency: string // SOL, USDC, etc
    usdValue?: string
  }
  supply?: {
    current: number
    max: number
  }
  publicKey: string
  onApprove: () => void
  onReject: () => void
  isProcessing?: boolean
  error?: string | null
}

export function NFTMintPreview({
  collection,
  nft,
  price,
  supply,
  publicKey,
  onApprove,
  onReject,
  isProcessing = false,
  error
}: NFTMintPreviewProps) {
  return (
    <div>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '24px'
      }}>
        <h2 className="liquidroute-title" style={{ margin: '0 0 8px 0' }}>
          Mint NFT
        </h2>
        
        <p className="liquidroute-subtitle" style={{ margin: 0 }}>
          You're about to mint a new NFT
        </p>
      </div>

      {/* NFT Preview */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(153, 69, 255, 0.05) 0%, rgba(20, 241, 149, 0.05) 100%)',
        border: '1px solid rgba(153, 69, 255, 0.15)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        {/* NFT Image */}
        <div style={{
          width: '100%',
          aspectRatio: '1',
          borderRadius: '12px',
          background: nft.image ? `url(${nft.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          marginBottom: '16px',
          position: 'relative'
        }}>
          {/* Rarity Badge */}
          {nft.rarity && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
              color: nft.rarity === 'Legendary' ? '#FFD700' : 
                     nft.rarity === 'Epic' ? '#B968FF' :
                     nft.rarity === 'Rare' ? '#4B9BFF' : '#fff',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {nft.rarity}
            </div>
          )}
        </div>

        {/* NFT Details */}
        <div>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 600,
            margin: '0 0 8px 0'
          }}>
            {nft.name}
          </h3>

          {/* Collection */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: collection.image ? `url(${collection.image})` : '#9945FF',
              backgroundSize: 'cover'
            }} />
            <span style={{ fontSize: '14px', opacity: 0.8 }}>
              {collection.name}
            </span>
            {collection.verified && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="#14F195" strokeWidth="3" strokeLinecap="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" 
                  stroke="#14F195" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </div>

          {/* Description */}
          {nft.description && (
            <p style={{
              fontSize: '13px',
              lineHeight: 1.5,
              opacity: 0.8,
              margin: '0 0 16px 0'
            }}>
              {nft.description}
            </p>
          )}

          {/* Attributes */}
          {nft.attributes && nft.attributes.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              marginTop: '12px'
            }}>
              {nft.attributes.slice(0, 4).map((attr, i) => (
                <div key={i} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '2px' }}>
                    {attr.trait}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>
                    {attr.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mint Details */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        {/* Price */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '13px', opacity: 0.6 }}>Mint Price</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>
              {price.amount} {price.currency}
            </div>
            {price.usdValue && (
              <div style={{ fontSize: '11px', opacity: 0.6 }}>
                ≈ ${price.usdValue}
              </div>
            )}
          </div>
        </div>

        {/* Supply */}
        {supply && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '13px', opacity: 0.6 }}>Supply</span>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>
              {supply.current} / {supply.max}
            </span>
          </div>
        )}

        {/* Creator */}
        {collection.creator && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '13px', opacity: 0.6 }}>Creator</span>
            <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>
              {StringFormatter.truncate(collection.creator, { start: 6, end: 4 })}
            </span>
          </div>
        )}

        {/* Network */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '13px', opacity: 0.6 }}>Network</span>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#14F195'
            }} />
            Solana
          </span>
        </div>
      </div>

      {/* Limited Supply Warning */}
      {supply && supply.max - supply.current < 100 && (
        <div style={{
          background: 'rgba(255, 193, 7, 0.08)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '20px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '16px' }}>🔥</span>
          <div style={{ fontSize: '12px', lineHeight: 1.4, flex: 1 }}>
            <strong>Almost sold out!</strong> Only {supply.max - supply.current} NFTs remaining.
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
          {isProcessing ? 'Minting...' : 'Mint NFT'}
        </button>
      </div>
    </div>
  )
}
