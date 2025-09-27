'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Transaction } from '@solana/web3.js'
import { fromWindow, bridge, type Bridge } from '@/lib/messenger/Messenger'
import type { RpcRequest, RpcResponse } from '@/lib/messenger/types'
import { config, isTrustedOrigin } from '@/lib/config'
import {
  createPasskeyWallet,
  authenticateWithPasskey,
  deriveWalletAccount,
  isPasskeyAvailable,
  getStoredCredentialId,
  storeCredentialId,
  type PasskeyAuthResult
} from '@/lib/passkey/wallet'
import './liquidroute-ui.css'

// LiquidRoute icon (simplified SVG)
const LiquidRouteIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#0090ff"/>
    <path d="M16 8L22 14L16 20L10 14L16 8Z" fill="white"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M12.7 3.3a1 1 0 0 0-1.4 0L8 6.6 4.7 3.3a1 1 0 1 0-1.4 1.4L6.6 8l-3.3 3.3a1 1 0 0 0 1.4 1.4L8 9.4l3.3 3.3a1 1 0 0 0 1.4-1.4L9.4 8l3.3-3.3a1 1 0 0 0 0-1.4Z"/>
  </svg>
)

export default function LiquidRouteWalletPage() {
  // State management
  const [isReady, setIsReady] = useState(false)
  const [mode, setMode] = useState<'floating' | 'drawer'>('floating')
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [currentRequest, setCurrentRequest] = useState<RpcRequest | null>(null)
  const [parentOrigin, setParentOrigin] = useState<string>('*')
  const [authResult, setAuthResult] = useState<PasskeyAuthResult | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [hasPasskey, setHasPasskey] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const messengerRef = useRef<Bridge | null>(null)
  
  // Check viewport size for responsive mode
  useEffect(() => {
    const checkSize = () => {
      setMode(window.innerWidth < 480 ? 'drawer' : 'floating')
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])
  
  // Initialize messenger and passkey
  useEffect(() => {
    if (!isReady && typeof window !== 'undefined') {
      // Check passkey availability
      isPasskeyAvailable().then(available => {
        if (available) {
          const credId = getStoredCredentialId()
          setHasPasskey(!!credId)
        }
      })
      
      // Setup messenger
      const isIframe = window.parent !== window
      const targetWindow = isIframe ? window.parent : window.opener
      
      if (targetWindow) {
        const fromMessenger = fromWindow(window)
        const toMessenger = fromWindow(targetWindow)
        
        const messenger = bridge({
          from: fromMessenger,
          to: toMessenger,
          waitForReady: false
        })
        
        messengerRef.current = messenger
        
        // Send ready signal
        messenger.ready({
          chainIds: ['mainnet-beta'],
          trustedHosts: config.trustedOrigins.map(origin => {
            try {
              return new URL(origin).hostname
            } catch {
              return origin
            }
          })
        })
        
        // Listen for init message
        messenger.on('__internal', (payload: any, event?: MessageEvent) => {
          if (payload.type === 'init' && event) {
            setParentOrigin(event.origin)
          }
        })
        
        // Listen for RPC requests
        messenger.on('rpc-requests', async (requests: RpcRequest[], event?: MessageEvent) => {
          const request = Array.isArray(requests) ? requests[0] : requests as any
          if (!request) return
          
          // Validate origin
          if (event && !isTrustedOrigin(event.origin)) {
            return
          }
          
          setCurrentRequest(request)
          setError(null) // Clear any previous errors
          
          // Auto-approve if already authenticated for connect
          if (request.method === 'connect' && authResult && publicKey) {
            console.log('[Wallet] Auto-approving connect request with existing auth')
            setTimeout(() => handleApprove(), 100) // Small delay to ensure state is set
          }
        })
        
        setIsReady(true)
      }
    }
  }, [isReady, authResult, publicKey])
  
  // Handle passkey authentication
  const handlePasskeyAuth = useCallback(async (isNewUser: boolean) => {
    try {
      setIsAuthenticating(true)
      
      let result: PasskeyAuthResult
      if (isNewUser) {
        // Explicitly creating a new passkey account
        const username = `user@${window.location.hostname}`
        const displayName = 'LiquidRoute User'
        result = await createPasskeyWallet(username, displayName)
      } else {
        // Try to authenticate with existing passkey
        const credId = getStoredCredentialId()
        try {
          result = await authenticateWithPasskey(credId || undefined)
        } catch (authError: any) {
          // If authentication fails (no existing passkey), create a new one
          console.log('No existing passkey found, creating new one')
          const username = `user@${window.location.hostname}`
          const displayName = 'LiquidRoute User'
          result = await createPasskeyWallet(username, displayName)
        }
      }
      
      storeCredentialId(result.credentialId)
      setAuthResult(result)
      setPublicKey(result.wallet.publicKey)
      setHasPasskey(true)
      
      // If there's a pending connect request, approve it immediately
      if (currentRequest && currentRequest.method === 'connect') {
        setTimeout(() => handleApprove(result), 100) // Small delay to ensure state is updated
      }
      
    } catch (error) {
      console.error('Passkey auth failed:', error)
    } finally {
      setIsAuthenticating(false)
    }
  }, [currentRequest])
  
  // Handle request approval
  const handleApprove = useCallback(async (authResultOverride?: PasskeyAuthResult) => {
    if (!currentRequest || !messengerRef.current) return
    
    setError(null) // Clear any previous error when retrying
    
    const auth = authResultOverride || authResult
    const pubKey = auth?.wallet?.publicKey || publicKey
    
    if (!pubKey) {
      console.error('No public key available')
      setError('No wallet available. Please authenticate first.')
      return
    }
    
    try {
      let result: any
      
      switch (currentRequest.method) {
        case 'connect':
          result = { publicKey: pubKey }
          console.log('[Wallet] Sending connect response with publicKey:', pubKey)
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 2000)
          break
          
        case 'signMessage':
          if (!auth) throw new Error('Not authenticated')
          const messageKeypair = await deriveWalletAccount(auth.masterSeed, 0)
          const message = Buffer.from((currentRequest.params as any)?.message || '', 'base64')
          const signature = await import('tweetnacl').then(nacl =>
            nacl.sign.detached(message, messageKeypair.secretKey)
          )
          result = { signature: Buffer.from(signature).toString('base64') }
          break
          
        case 'signTransaction':
          if (!auth) throw new Error('Not authenticated')
          const txKeypair = await deriveWalletAccount(auth.masterSeed, 0)
          const txData = (currentRequest.params as any).transaction
          const tx = Transaction.from(Buffer.from(txData, 'base64'))
          tx.sign(txKeypair)
          result = { signedTransaction: tx.serialize().toString('base64') }
          break
          
        case 'disconnect':
          setPublicKey(null)
          setAuthResult(null)
          result = { success: true }
          break
          
        default:
          throw new Error(`Method ${currentRequest.method} not supported`)
      }
      
      const response: RpcResponse = {
        id: currentRequest.id,
        result,
        _request: currentRequest
      }
      
      messengerRef.current.send('rpc-response', response)
      setCurrentRequest(null)
      
    } catch (error: any) {
      // Show user-friendly error messages
      let errorMessage = error.message || 'An error occurred'
      
      // Make common errors more user-friendly
      if (errorMessage.includes('no record of a prior credit')) {
        errorMessage = 'Insufficient balance. Please add SOL to your wallet.'
      } else if (errorMessage.includes('Not authenticated')) {
        errorMessage = 'Please authenticate first'
      }
      
      setError(errorMessage)
      
      const response: RpcResponse = {
        id: currentRequest.id,
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        },
        _request: currentRequest
      }
      
      messengerRef.current.send('rpc-response', response)
      // Don't clear currentRequest so user can retry
    }
  }, [currentRequest, publicKey, authResult])
  
  // Handle request rejection
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
    setCurrentRequest(null)
    setError(null)
  }, [currentRequest])
  
  // Render nothing if not in iframe/popup
  if (typeof window !== 'undefined' && window === window.parent && !window.opener) {
    return null
  }
  
  return (
    <div className={`liquidroute-frame ${mode}`}>
      {/* Dark overlay background */}
      {mode === 'floating' && <div className="liquidroute-overlay" onClick={handleReject} />}
      
      {/* Main dialog */}
      <div className={`liquidroute-dialog ${mode}`}>
        {/* Frame bar (header) */}
        <div className="liquidroute-frame-bar">
          <div className="liquidroute-frame-icon">
            <LiquidRouteIcon />
          </div>
          <div className="liquidroute-frame-label">
            {parentOrigin !== '*' ? new URL(parentOrigin).hostname : 'LiquidRoute'}
          </div>
          <button className="liquidroute-frame-close" onClick={handleReject}>
            <CloseIcon />
          </button>
        </div>
        
        {/* Content area */}
        <div className="liquidroute-content">
          {showSuccess ? (
            // Success state
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="liquidroute-logo" style={{ margin: '0 auto 16px' }}>
                <LiquidRouteIcon />
              </div>
              <h2 className="liquidroute-title">Connected!</h2>
              <p className="liquidroute-subtitle">You can now use your wallet</p>
            </div>
          ) : !authResult ? (
            // Sign in screen
            <div>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div className="liquidroute-logo" style={{ margin: '0 auto' }}>
                  <LiquidRouteIcon />
                </div>
                <h1 className="liquidroute-title">
                  {hasPasskey ? 'Sign in' : 'Get started'}
                </h1>
                <p className="liquidroute-subtitle">
                  Use LiquidRoute to sign in to {parentOrigin !== '*' ? new URL(parentOrigin).hostname : 'this app'}.
                </p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {hasPasskey ? (
                  <>
                    <button
                      className="liquidroute-button primary"
                      onClick={() => handlePasskeyAuth(false)}
                      disabled={isAuthenticating}
                    >
                      {isAuthenticating ? 'Signing in...' : 'Sign in with LiquidRoute'}
                    </button>
                    
                    <button
                      className="liquidroute-button secondary"
                      onClick={() => {
                        setAuthResult(null)
                        setPublicKey(null)
                        setHasPasskey(false)
                      }}
                    >
                      Use different account
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="liquidroute-button primary"
                      onClick={() => handlePasskeyAuth(false)}
                      disabled={isAuthenticating}
                    >
                      {isAuthenticating ? 'Authenticating...' : 'Sign in or Create Account'}
                    </button>
                    
                    <p className="liquidroute-text-small" style={{ 
                      marginTop: '12px', 
                      textAlign: 'center',
                      opacity: 0.7 
                    }}>
                      Uses your device's passkey (Touch ID, Face ID, etc.)
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : currentRequest ? (
            // Request approval screen
            <div>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 className="liquidroute-title">
                  {currentRequest.method === 'connect' && 'Connect'}
                  {currentRequest.method === 'signMessage' && 'Sign Message'}
                  {currentRequest.method === 'signTransaction' && 'Sign Transaction'}
                </h2>
                <p className="liquidroute-subtitle">
                  {parentOrigin !== '*' ? new URL(parentOrigin).hostname : 'This app'} is requesting access
                </p>
              </div>
              
              {/* Error display */}
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
                  {error.includes('Insufficient balance') && publicKey && (
                    <p style={{
                      color: '#ef4444',
                      margin: '8px 0 0',
                      fontSize: '12px',
                      opacity: 0.8,
                      wordBreak: 'break-all'
                    }}>
                      Wallet: {publicKey}
                    </p>
                  )}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="liquidroute-button secondary"
                  onClick={handleReject}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  className="liquidroute-button primary"
                  onClick={() => handleApprove()}
                  style={{ flex: 1 }}
                >
                  {error ? 'Retry' : 'Approve'}
                </button>
              </div>
            </div>
          ) : (
            // Idle state
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="liquidroute-logo" style={{ margin: '0 auto 16px' }}>
                <LiquidRouteIcon />
              </div>
              <h2 className="liquidroute-title">LiquidRoute</h2>
              <p className="liquidroute-subtitle">Connected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
