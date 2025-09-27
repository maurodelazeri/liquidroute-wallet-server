'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createPasskeyWallet, authenticateWithPasskey } from '@/lib/passkey/wallet'
import { fromWindow as MessengerFromWindow } from '@/lib/messenger/Messenger'
import { Frame, Screen } from '@/components/porto/Frame'
import { Button } from '@/components/porto/Button'
import type { RpcRequest, RpcResponse, SolanaRpcMethod } from '@/lib/messenger/types'
import { config } from '@/lib/config'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import * as nacl from 'tweetnacl'
import './porto-system.css'

export default function PortoWalletUI() {
  const initRef = useRef(false)
  const messengerRef = useRef<ReturnType<typeof MessengerFromWindow> | null>(null)
  
  // State
  const [isIframe, setIsIframe] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentRequest, setCurrentRequest] = useState<RpcRequest | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [display, setDisplay] = useState<'floating' | 'drawer' | 'full'>('floating')

  // Initialize once
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const inIframe = window.self !== window.top
    setIsIframe(inIframe)
    
    if (inIframe) {
      setDisplay(window.innerWidth >= 480 ? 'floating' : 'drawer')
    }

    const storedCredentialId = localStorage.getItem('liquidroute_credential_id')
    const storedPublicKey = localStorage.getItem('liquidroute_public_key')
    const storedUsername = localStorage.getItem('liquidroute_username')
    
    if (storedCredentialId && storedPublicKey && storedUsername) {
      setPublicKey(storedPublicKey)
    }

    if (inIframe) {
      const messenger = MessengerFromWindow(
        window.parent as Window,
        {}
      )
      messengerRef.current = messenger
      
      messenger.send('ready', {})

      messenger.on('__internal', (data: any) => {
        console.log('[Wallet] Received __internal message:', data)
      })

      messenger.on('rpc-requests', async (requests: RpcRequest[]) => {
        if (!Array.isArray(requests) || requests.length === 0) return
        
        const request = requests[0]
        console.log('[Wallet] Received RPC request:', request)
        
        if (request.method === 'connect') {
          if (storedPublicKey) {
            const response: RpcResponse = {
              id: request.id,
              result: { 
                publicKey: storedPublicKey,
                connected: true
              },
              _request: request
            }
            messenger.send('rpc-response', response)
            messenger.send('close', {})
          } else {
            setCurrentRequest(request)
          }
        } else if (request.method === 'disconnect') {
          localStorage.removeItem('liquidroute_credential_id')
          localStorage.removeItem('liquidroute_public_key')
          localStorage.removeItem('liquidroute_username')
          setPublicKey(null)
          
          const response: RpcResponse = {
            id: request.id,
            result: { disconnected: true },
            _request: request
          }
          messenger.send('rpc-response', response)
          messenger.send('close', {})
        } else {
          setCurrentRequest(request)
        }
      })

      return () => messenger.destroy()
    }
  }, [])

  const handlePasskeyAuth = useCallback(async () => {
    try {
      setIsProcessing(true)
      setError(null)

      const storedCredentialId = localStorage.getItem('liquidroute_credential_id')
      let authResult

      if (!storedCredentialId) {
        // New user - create wallet
        authResult = await createPasskeyWallet('LiquidRoute Wallet')
        
        localStorage.setItem('liquidroute_credential_id', authResult.credentialId)
        localStorage.setItem('liquidroute_public_key', authResult.wallet.publicKey)
        localStorage.setItem('liquidroute_username', 'LiquidRoute User')
        localStorage.setItem(`seed_${authResult.wallet.publicKey}`, Buffer.from(authResult.masterSeed).toString('base64'))
      } else {
        // Existing user - authenticate
        try {
          authResult = await authenticateWithPasskey(storedCredentialId)
          // Save/update the seed
          localStorage.setItem(`seed_${authResult.wallet.publicKey}`, Buffer.from(authResult.masterSeed).toString('base64'))
        } catch (err: any) {
          if (err.message?.includes('No passkeys') || err.message?.includes('not found')) {
            // Credential invalid, create new
            authResult = await createPasskeyWallet('LiquidRoute Wallet')
            
            localStorage.setItem('liquidroute_credential_id', authResult.credentialId)
            localStorage.setItem('liquidroute_public_key', authResult.wallet.publicKey)
            localStorage.setItem('liquidroute_username', 'LiquidRoute User')
            localStorage.setItem(`seed_${authResult.wallet.publicKey}`, Buffer.from(authResult.masterSeed).toString('base64'))
          } else {
            throw err
          }
        }
      }

      setPublicKey(authResult.wallet.publicKey)

      // Handle connect request
      if (currentRequest?.method === 'connect' && messengerRef.current) {
        const response: RpcResponse = {
          id: currentRequest.id,
          result: {
            publicKey: authResult.wallet.publicKey,
            connected: true
          },
          _request: currentRequest
        }
        messengerRef.current.send('rpc-response', response)
        messengerRef.current.send('close', {})
        setCurrentRequest(null)
      }

      setIsProcessing(false)
    } catch (err: any) {
      console.error('[Wallet] Passkey auth error:', err)
      setError(err.message || 'Authentication failed')
      setIsProcessing(false)
    }
  }, [currentRequest])

  const handleApprove = useCallback(async () => {
    if (!currentRequest || !messengerRef.current || !publicKey) return
    
    try {
      setIsProcessing(true)
      setError(null)

      const storedSeed = localStorage.getItem(`seed_${publicKey}`)
      if (!storedSeed) throw new Error('Wallet seed not found')
      
      const seed = Buffer.from(storedSeed, 'base64')
      const keypair = nacl.sign.keyPair.fromSeed(seed)

      let result: any

      if (currentRequest.method === 'signMessage') {
        const message = Buffer.from(currentRequest.params?.message || '', 'base64')
        const signature = nacl.sign.detached(message, keypair.secretKey)
        result = { signature: Buffer.from(signature).toString('base64') }
      } else if (currentRequest.method === 'signTransaction') {
        const txData = currentRequest.params?.transaction
        
        if (txData === 'mock-transaction') {
          // Demo transaction
          result = { signedTransaction: '' }
        } else {
          const tx = Transaction.from(Buffer.from(txData, 'base64'))
          tx.partialSign({
            publicKey: new PublicKey(publicKey),
            secretKey: keypair.secretKey
          })
          
          const serialized = tx.serialize()
          result = { signedTransaction: Buffer.from(serialized).toString('base64') }
        }

        setTransactionHash('0x' + Math.random().toString(36).substring(2, 15))
        setShowSuccessScreen(true)
      }

      const response: RpcResponse = {
        id: currentRequest.id,
        result,
        _request: currentRequest
      }
      
      messengerRef.current.send('rpc-response', response)
      
      if (currentRequest.method !== 'signTransaction') {
        messengerRef.current.send('close', {})
        setCurrentRequest(null)
      }
      
      setIsProcessing(false)
    } catch (err: any) {
      console.error('[Wallet] Approve error:', err)
      
      if (err.message?.includes('Attempt to debit')) {
        setError('Insufficient balance. Please add SOL to your wallet.')
      } else {
        setError(err.message || 'Failed to process request')
      }
      
      setIsProcessing(false)
    }
  }, [currentRequest, publicKey])

  const handleReject = useCallback(() => {
    if (!currentRequest || !messengerRef.current) return
    
    const response: RpcResponse = {
      id: currentRequest.id,
      error: {
        code: 4001,
        message: 'User rejected the request'
      },
      _request: currentRequest
    }
    
    messengerRef.current.send('rpc-response', response)
    messengerRef.current.send('close', {})
    setCurrentRequest(null)
    setError(null)
  }, [currentRequest])

  const handleCloseSuccess = useCallback(() => {
    setShowSuccessScreen(false)
    setTransactionHash(null)
    setCurrentRequest(null)
    if (messengerRef.current) {
      messengerRef.current.send('close', {})
    }
  }, [])

  const renderContent = () => {
    // Success Screen
    if (showSuccessScreen) {
      return (
        <Screen>
          <div className="porto-flex porto-flex-col porto-items-center porto-gap-3">
            <div className="porto-success-check">
              <svg 
                width="40" 
                height="40" 
                viewBox="0 0 24 24" 
                fill="white"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            </div>
            <h2 className="porto-title">Transaction Complete!</h2>
            <p className="porto-subtitle">Your transaction was successful</p>
            {transactionHash && (
              <a 
                href={`https://solscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="porto-text-secondary"
                style={{ fontSize: '14px' }}
              >
                View on Solscan →
              </a>
            )}
            <Button
              variant="primary"
              fullWidth
              onClick={handleCloseSuccess}
            >
              Done
            </Button>
          </div>
        </Screen>
      )
    }

    // Sign Message Request
    if (currentRequest?.method === 'signMessage') {
      const message = currentRequest.params?.message 
        ? Buffer.from(currentRequest.params.message, 'base64').toString('utf-8')
        : 'No message'
      
      return (
        <Screen>
          <div className="porto-flex porto-flex-col porto-gap-3">
            <h2 className="porto-title">Sign Message</h2>
            <p className="porto-subtitle">Review and approve this action</p>
            
            <div className="porto-card">
              <div className="porto-flex porto-flex-col porto-gap-2">
                <div className="porto-flex porto-justify-between">
                  <span className="porto-text-secondary">From</span>
                  <span className="porto-text" style={{ fontSize: '14px' }}>
                    {publicKey?.slice(0, 8)}...{publicKey?.slice(-6)}
                  </span>
                </div>
                <div className="porto-flex porto-justify-between">
                  <span className="porto-text-secondary">Network</span>
                  <span className="porto-text">Solana Mainnet</span>
                </div>
                <div className="porto-flex porto-justify-between">
                  <span className="porto-text-secondary">Est. Fee</span>
                  <span className="porto-text">~0.000005 SOL</span>
                </div>
              </div>
            </div>

            <div className="porto-card">
              <h3 className="porto-text" style={{ marginBottom: '12px' }}>Message to Sign</h3>
              <pre className="porto-text" style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all',
                background: 'var(--background-color-th_field)',
                padding: '12px',
                borderRadius: 'var(--radius-th_medium)',
                fontSize: '13px'
              }}>
                {message}
              </pre>
            </div>

            <div className="porto-warning-box">
              Only sign messages from trusted sources. This action cannot be undone.
            </div>

            {error && <div className="porto-error">{error}</div>}

            <div className="porto-flex porto-gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleReject}
                disabled={isProcessing}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleApprove}
                loading={isProcessing}
              >
                Approve
              </Button>
            </div>
          </div>
        </Screen>
      )
    }

    // Sign Transaction Request
    if (currentRequest?.method === 'signTransaction') {
      return (
        <Screen>
          <div className="porto-flex porto-flex-col porto-gap-3">
            <h2 className="porto-title">Sign Transaction</h2>
            <p className="porto-subtitle">Review and approve this transaction</p>
            
            <div className="porto-card">
              <div className="porto-flex porto-flex-col porto-gap-2">
                <div className="porto-flex porto-justify-between">
                  <span className="porto-text-secondary">From</span>
                  <span className="porto-text" style={{ fontSize: '14px' }}>
                    {publicKey?.slice(0, 8)}...{publicKey?.slice(-6)}
                  </span>
                </div>
                <div className="porto-flex porto-justify-between">
                  <span className="porto-text-secondary">Network</span>
                  <span className="porto-text">Solana Mainnet</span>
                </div>
                <div className="porto-flex porto-justify-between">
                  <span className="porto-text-secondary">Est. Fee</span>
                  <span className="porto-text">~0.000005 SOL</span>
                </div>
              </div>
            </div>

            {error && <div className="porto-error">{error}</div>}

            <div className="porto-flex porto-gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleReject}
                disabled={isProcessing}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleApprove}
                loading={isProcessing}
              >
                Approve
              </Button>
            </div>
          </div>
        </Screen>
      )
    }

    // Connect Request / Default
    if (!publicKey || currentRequest?.method === 'connect') {
      return (
        <Screen>
          <div className="porto-flex porto-flex-col porto-items-center porto-gap-3">
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="40" height="40" viewBox="0 0 32 32" fill="white">
                <rect width="32" height="32" rx="8" fill="transparent"/>
                <path d="M16 8L8 16L16 24" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 8L24 16L16 24" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
              </svg>
            </div>
            
            <h2 className="porto-title">Welcome to LiquidRoute</h2>
            <p className="porto-subtitle">
              Sign in to {config.trustedOrigins.includes(window.location.origin) 
                ? window.location.hostname 
                : 'this app'} with your passkey
            </p>

            {error && <div className="porto-error">{error}</div>}

            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={handlePasskeyAuth}
              loading={isProcessing}
            >
              Continue with Passkey
            </Button>

            <p className="porto-text-secondary porto-text-center" style={{ fontSize: '13px' }}>
              {publicKey ? 'Sign in with your existing passkey' : 'Create a new wallet or sign in'}
            </p>
          </div>
        </Screen>
      )
    }

    // Account connected but no active request
    if (publicKey) {
      return (
        <Screen>
          <div className="porto-flex porto-flex-col porto-items-center porto-gap-3">
            <div className="porto-success-check">
              <svg 
                width="40" 
                height="40" 
                viewBox="0 0 24 24" 
                fill="white"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            </div>
            <h2 className="porto-title">Connected!</h2>
            <p className="porto-subtitle">
              {publicKey.slice(0, 8)}...{publicKey.slice(-6)}
            </p>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                if (messengerRef.current) {
                  messengerRef.current.send('close', {})
                }
              }}
            >
              Close
            </Button>
          </div>
        </Screen>
      )
    }

    return null
  }

  const frameVariant = display === 'drawer' ? 'drawer' : 'floating'

  return (
    <Frame
      mode="dialog"
      variant={frameVariant}
      onClose={isIframe && messengerRef.current ? () => {
        if (currentRequest && messengerRef.current) {
          handleReject()
        } else {
          messengerRef.current?.send('close', {})
        }
      } : undefined}
      site={{
        label: 'LiquidRoute',
        verified: true
      }}
      visible
    >
      {renderContent()}
    </Frame>
  )
}
