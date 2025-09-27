'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Transaction } from '@solana/web3.js'
import { fromWindow, bridge, type Bridge } from '@/lib/messenger/Messenger'
import type { RpcRequest, RpcResponse, SolanaRpcMethod } from '@/lib/messenger/types'
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
import { useStore, store } from '@/lib/store/Dialog'
import { Layout } from '@/components/Layout'
import { StringFormatter } from '@/lib/utils/StringFormatter'
import { InsufficientFunds } from './screens/InsufficientFunds'
import { ActionPreview } from './screens/ActionPreview'
import { SwapPreview } from './screens/SwapPreview'
import { NFTMintPreview } from './screens/NFTMintPreview'
import { PaymentPreview } from './screens/PaymentPreview'
import { Success } from './screens/Success'
import { TransactionAnalyzer, type ContextMetadata } from '@/lib/context/TransactionAnalyzer'
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
  // Use Zustand store exactly like Porto
  const accounts = useStore((state) => state.accounts)
  const accountMetadata = useStore((state) => state.accountMetadata)
  const display = useStore((state) => state.display)
  const referrer = useStore((state) => state.referrer)
  const mode = useStore((state) => state.mode)
  
  // Get current account from store (first account like Porto)
  const currentAccount = accounts[0]
  
  // Local state management
  const [isReady, setIsReady] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(currentAccount?.address || null)
  const [currentRequest, setCurrentRequest] = useState<RpcRequest | null>(null)
  const [parentOrigin, setParentOrigin] = useState<string>(referrer?.origin || '*')
  const [authResult, setAuthResult] = useState<PasskeyAuthResult | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [hasPasskey, setHasPasskey] = useState(!!currentAccount)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false)
  const [requiredAmount, setRequiredAmount] = useState<string>('0.0001')
  const [transactionContext, setTransactionContext] = useState<ContextMetadata | null>(null)
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  const [lastTransactionHash, setLastTransactionHash] = useState<string | null>(null)
  
  const messengerRef = useRef<Bridge | null>(null)
  
  // Check viewport size and update store display mode (exactly like Porto)
  useEffect(() => {
    const checkSize = () => {
      const newDisplay = window.innerWidth < 480 ? 'drawer' : 'floating'
      store.setState((state) => ({ ...state, display: newDisplay }))
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])
  
  // Initialize messenger and passkey
  useEffect(() => {
    if (!isReady && typeof window !== 'undefined') {
      // Check for existing account in store (exactly like Porto)
      const storedAccounts = store.getState().accounts
      if (storedAccounts.length > 0) {
        const account = storedAccounts[0]
        setPublicKey(account.address)
        setHasPasskey(true)
        // Try to load the auth result if we have credentials stored
        const metadata = store.getState().accountMetadata[account.address]
        if (metadata?.credentialId) {
          storeCredentialId(metadata.credentialId)
        }
      } else {
        // Check passkey availability for new users
        isPasskeyAvailable().then(available => {
          if (available) {
            const credId = getStoredCredentialId()
            setHasPasskey(!!credId)
          }
        })
      }
      
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
        
        // Listen for init message and update store (exactly like Porto)
        messenger.on('__internal', (payload: any, event?: MessageEvent) => {
          if (payload.type === 'init' && event) {
            setParentOrigin(event.origin)
            // Update store referrer exactly like Porto
            store.setState((state) => ({
              ...state,
              referrer: {
                origin: event.origin,
                url: payload.referrer?.url ? new URL(payload.referrer.url) : undefined,
                title: payload.referrer?.title
              },
              mode: payload.mode || 'iframe'
            }))
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
          
          // Analyze transaction context if metadata is provided
          if (request.params && (request.params.metadata || request.params.calls)) {
            const context = TransactionAnalyzer.analyzeTransaction(request.params)
            setTransactionContext(context)
            console.log('[Wallet] Transaction context:', context)
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
      setError(null) // Clear any previous errors
      
      let result: PasskeyAuthResult
      if (isNewUser) {
        // Explicitly creating a new passkey account
        const username = `user@${window.location.hostname}`
        const displayName = 'LiquidRoute User'
        result = await createPasskeyWallet(username, displayName)
      } else {
        // For sign in: check if we have a stored credential
        const credId = getStoredCredentialId()
        if (!credId) {
          // No stored credential, so this is definitely a new user - create account
          console.log('No stored credential found, creating new account')
          const username = `user@${window.location.hostname}`
          const displayName = 'LiquidRoute User'
          result = await createPasskeyWallet(username, displayName)
        } else {
          // We have a stored credential, try to authenticate
          try {
            result = await authenticateWithPasskey(credId)
          } catch (authError: any) {
            // Authentication failed, maybe credential was deleted or wrong domain
            console.error('Authentication failed:', authError)
            // If the error indicates no passkey exists, clear the invalid stored credential and create a new one
            if (authError.message?.includes('No passkeys') || 
                authError.message?.includes('not found') ||
                authError.message?.includes('not available')) {
              console.log('Stored credential not valid, clearing and creating new account')
              // Clear the invalid credential from storage
              localStorage.removeItem('liquidroute:credentialId')
              setHasPasskey(false)
              
              const username = `user@${window.location.hostname}`
              const displayName = 'LiquidRoute User'
              result = await createPasskeyWallet(username, displayName)
            } else {
              throw authError
            }
          }
        }
      }
      
      storeCredentialId(result.credentialId)
      setAuthResult(result)
      setPublicKey(result.wallet.publicKey)
      setHasPasskey(true)
      
      // Update store exactly like Porto - persist account
      store.setState((state) => ({
        ...state,
        accounts: [{
          address: result.wallet.publicKey,
          credentialId: result.credentialId
        }],
        accountMetadata: {
          ...state.accountMetadata,
          [result.wallet.publicKey]: {
            credentialId: result.credentialId,
            lastUsed: Date.now()
          }
        }
      }))
      
      // If there's a pending connect request, approve it immediately
      if (currentRequest && currentRequest.method === 'connect') {
        setTimeout(() => handleApprove(result), 100) // Small delay to ensure state is updated
      }
      
    } catch (error: any) {
      console.error('Passkey auth failed:', error)
      setError(error.message || 'Authentication failed')
    } finally {
      setIsAuthenticating(false)
    }
  }, [currentRequest, hasPasskey])
  
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
      if (errorMessage.includes('no record of a prior credit') || 
          errorMessage.includes('insufficient') ||
          errorMessage.toLowerCase().includes('insufficient balance')) {
        // Show insufficient funds screen for transaction errors
        if (currentRequest.method === 'signTransaction') {
          setShowInsufficientFunds(true)
          // Try to extract required amount from error if possible
          const match = errorMessage.match(/(\d+\.?\d*)\s*SOL/i)
          if (match) {
            setRequiredAmount(match[1])
          }
          return // Don't send error response yet
        }
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
    <div className={`liquidroute-frame ${display}`}>
      {/* Dark overlay background */}
      {display === 'floating' && <div className="liquidroute-overlay" onClick={handleReject} />}
      
      {/* Main dialog */}
      <div className={`liquidroute-dialog ${display}`}>
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
                      {isAuthenticating 
                        ? 'Processing...' 
                        : 'Continue with Passkey'}
                    </button>
                    
                    {/* Show account at bottom if exists - exactly like Porto */}
                    {currentAccount && (
                      <div style={{ 
                        marginTop: '20px', 
                        borderTop: '1px solid rgba(0,0,0,0.1)', 
                        paddingTop: '12px' 
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between'
                        }}>
                          <span className="liquidroute-text-small" style={{ 
                            opacity: 0.6,
                            fontSize: '13px'
                          }}>
                            Using
                          </span>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span className="liquidroute-text-small" style={{ 
                              fontFamily: 'monospace',
                              fontSize: '14px',
                              fontWeight: 500
                            }}>
                              {StringFormatter.truncate(currentAccount.address, { end: 6, start: 8 })}
                            </span>
                            <button 
                              className="liquidroute-text-small"
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: 'var(--color-th_link)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                textDecoration: 'underline'
                              }}
                              onClick={() => {
                                // Clear account and start fresh
                                store.setState((state) => ({
                                  ...state,
                                  accounts: [],
                                  accountMetadata: {}
                                }))
                                setAuthResult(null)
                                setPublicKey(null)
                                setHasPasskey(false)
                              }}
                            >
                              Switch • Sign up
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!currentAccount && (
                      <p className="liquidroute-text-small" style={{ 
                        marginTop: '12px', 
                        textAlign: 'center',
                        opacity: 0.7 
                      }}>
                        First time? You'll create a new passkey (2 prompts)
                      </p>
                    )}
                    
                    {error && (
                      <div style={{
                        marginTop: '12px',
                        padding: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <p className="liquidroute-text-small" style={{ color: '#ef4444' }}>
                          {error}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : hasPasskey && publicKey && !currentRequest ? (
            // Idle state when authenticated (like Porto)
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="liquidroute-logo" style={{ margin: '0 auto 16px' }}>
                <LiquidRouteIcon />
              </div>
              <h2 className="liquidroute-title">LiquidRoute Wallet</h2>
              <p className="liquidroute-subtitle">Connected</p>
              
              {/* Show account footer even in idle state */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                <Layout.Footer.Account 
                  address={publicKey}
                  onClick={() => {
                    // Allow switching accounts
                    store.setState((state) => ({
                      ...state,
                      accounts: [],
                      accountMetadata: {}
                    }))
                    setAuthResult(null)
                    setPublicKey(null)
                    setHasPasskey(false)
                  }}
                />
              </div>
            </div>
          ) : showInsufficientFunds && publicKey ? (
            // Insufficient funds screen
            <InsufficientFunds
              publicKey={publicKey}
              requiredAmount={requiredAmount}
              onCancel={() => {
                setShowInsufficientFunds(false)
                if (currentRequest && messengerRef.current) {
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
                }
              }}
              onAddFunds={() => {
                setShowInsufficientFunds(false)
                // User says they've added funds, retry the request
                if (currentRequest) {
                  setError(null)
                  // Reset to show the approval screen again
                }
              }}
            />
          ) : showSuccessScreen ? (
            // Success screen
            <Success
              title="Transaction Complete!"
              message="Your transaction was successful"
              txHash={lastTransactionHash || undefined}
              onClose={() => {
                setShowSuccessScreen(false)
                setCurrentRequest(null)
              }}
            />
          ) : currentRequest && transactionContext?.type === 'swap' ? (
            // Swap preview screen
            <SwapPreview
              {...(transactionContext.details as any)}
              publicKey={publicKey || ''}
              onApprove={() => handleApprove()}
              onReject={handleReject}
              isProcessing={false}
              error={error}
            />
          ) : currentRequest && transactionContext?.type === 'nft-mint' ? (
            // NFT mint preview screen
            <NFTMintPreview
              {...(transactionContext.details as any)}
              publicKey={publicKey || ''}
              onApprove={() => handleApprove()}
              onReject={handleReject}
              isProcessing={false}
              error={error}
            />
          ) : currentRequest && transactionContext?.type === 'payment' ? (
            // Payment preview screen
            <PaymentPreview
              {...(transactionContext.details as any)}
              publicKey={publicKey || ''}
              onApprove={() => handleApprove()}
              onReject={handleReject}
              isProcessing={false}
              error={error}
            />
          ) : currentRequest ? (
            // Default request approval screen using ActionPreview component
            <ActionPreview
              method={currentRequest.method}
              from={publicKey || ''}
              to={(currentRequest.params as any)?.to}
              value={(currentRequest.params as any)?.value}
              message={currentRequest.params?.message ? 
                Buffer.from(currentRequest.params.message, 'base64').toString('utf-8') : undefined}
              onApprove={() => handleApprove()}
              onReject={handleReject}
              error={error}
              isProcessing={false}
            />
          ) : (
            // Fallback idle state
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="liquidroute-logo" style={{ margin: '0 auto 16px' }}>
                <LiquidRouteIcon />
              </div>
              <h2 className="liquidroute-title">LiquidRoute</h2>
              <p className="liquidroute-subtitle">Ready</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
