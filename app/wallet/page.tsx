'use client'

import { useState, useEffect, useRef } from 'react'
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

export default function WalletPage() {
  const [messenger, setMessenger] = useState<Bridge | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [currentRequest, setCurrentRequest] = useState<RpcRequest | null>(null)
  const [parentOrigin, setParentOrigin] = useState<string>('*')
  const [accountIndex, setAccountIndex] = useState(0)
  const [authResult, setAuthResult] = useState<PasskeyAuthResult | null>(null)
  const [isCreatingPasskey, setIsCreatingPasskey] = useState(false)
  const [hasPasskey, setHasPasskey] = useState(false)
  const [passkeySupported, setPasskeySupported] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const messengerRef = useRef<Bridge | null>(null)
  
  // Check for existing passkey on mount
  useEffect(() => {
    async function checkPasskey() {
      const available = await isPasskeyAvailable()
      setPasskeySupported(available)
      
      if (available) {
        const credId = getStoredCredentialId()
        setHasPasskey(!!credId)
      }
    }
    checkPasskey()
  }, [])
  
  // Initialize cross-domain messenger on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Determine if we're in iframe or popup
    const isIframe = window.parent !== window
    const targetWindow = isIframe ? window.parent : window.opener
    
    if (!targetWindow) {
      console.warn('No parent or opener window found')
      return
    }
    
    // Wait for the first message to get the parent origin
    const handleInitialMessage = (event: MessageEvent) => {
      // Validate that this is from a trusted origin
      if (!isTrustedOrigin(event.origin)) {
        console.warn('Rejected message from untrusted origin:', event.origin)
        return
      }
      
      console.log('Accepted connection from trusted origin:', event.origin)
      setParentOrigin(event.origin)
      
      // Create messenger with the specific origin for security
      const fromMessenger = fromWindow(window)
      const toMessenger = fromWindow(targetWindow, { targetOrigin: event.origin })
      
      const messenger = bridge({
        from: fromMessenger,
        to: toMessenger,
        waitForReady: false
      })
      
      // Send ready signal with trusted hosts from config
      messenger.ready({
        chainIds: ['mainnet-beta'], // Using QuickNode mainnet endpoint
        trustedHosts: config.trustedOrigins.map(origin => {
          try {
            return new URL(origin).hostname
          } catch {
            return origin
          }
        })
      })
      
      // Listen for RPC requests
      messenger.on('rpc-request', (request: RpcRequest) => {
        console.log('Received request:', request)
        setCurrentRequest(request)
        handleRequest(request, messenger)
      })
      
      setMessenger(messenger)
      messengerRef.current = messenger
      
      // Remove the initial listener after first message
      window.removeEventListener('message', handleInitialMessage)
    }
    
    // Listen for the initial message to establish origin
    window.addEventListener('message', handleInitialMessage)
    
    return () => {
      window.removeEventListener('message', handleInitialMessage)
      messengerRef.current?.destroy()
    }
  }, [])
  
  // Handle passkey authentication
  async function handlePasskeyAuth() {
    try {
      setIsCreatingPasskey(true)
      
      // Try to authenticate with existing passkey
      const credId = getStoredCredentialId()
      const result = await authenticateWithPasskey(credId || undefined)
      
      // Store credential ID for future use
      storeCredentialId(result.credentialId)
      setAuthResult(result)
      setPublicKey(result.wallet.publicKey)
      setIsConnected(true)
      setHasPasskey(true)
      
      // If there's a pending connect request, respond to it now
      if (currentRequest && currentRequest.method === 'connect' && messengerRef.current) {
        const response: RpcResponse = {
          id: currentRequest.id,
          result: { publicKey: result.wallet.publicKey },
          _request: currentRequest
        }
        messengerRef.current.send('rpc-response', response)
        setCurrentRequest(null)
      }
      
      return result
    } catch (error) {
      console.error('Passkey auth failed:', error)
      throw error
    } finally {
      setIsCreatingPasskey(false)
    }
  }
  
  // Handle creating a new passkey
  async function handleCreatePasskey() {
    try {
      setIsCreatingPasskey(true)
      setErrorMessage(null)
      
      // Use a default username - Porto doesn't prompt for this
      const username = `user@${window.location.hostname}`
      const displayName = 'LiquidRoute Wallet User'
      const result = await createPasskeyWallet(username, displayName)
      
      // Store credential ID for future use
      storeCredentialId(result.credentialId)
      setAuthResult(result)
      setPublicKey(result.wallet.publicKey)
      setIsConnected(true)
      setHasPasskey(true)
      
      // If there's a pending connect request, respond to it now
      if (currentRequest && currentRequest.method === 'connect' && messengerRef.current) {
        const response: RpcResponse = {
          id: currentRequest.id,
          result: { publicKey: result.wallet.publicKey },
          _request: currentRequest
        }
        messengerRef.current.send('rpc-response', response)
        setCurrentRequest(null)
      }
      
      return result
    } catch (error: any) {
      console.error('Failed to create passkey:', error)
      // Show error in UI like Porto does
      setErrorMessage(error.message || 'Failed to create passkey')
      // Clear error after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsCreatingPasskey(false)
    }
  }
  
  // Handle account index change
  async function handleAccountChange(newIndex: number) {
    if (!authResult?.masterSeed) return
    
    setAccountIndex(newIndex)
    const keypair = await deriveWalletAccount(authResult.masterSeed, newIndex)
    setPublicKey(keypair.publicKey.toBase58())
  }
  
  // Handle RPC requests from different domains
  async function handleRequest(request: RpcRequest, messenger: Bridge) {
    try {
      let result: any
      
      switch (request.method) {
            case 'connect':
              console.log('Connect request received, authResult:', !!authResult)
              
              // If not authenticated, show the passkey UI and wait for authentication
              if (!authResult) {
                // Set a flag that we're waiting for connection approval
                setCurrentRequest(request)
                return // Don't send response yet, wait for user to authenticate
              }
              
              // Already authenticated, return the public key
              result = { publicKey }
              break
          
        case 'disconnect':
          setPublicKey(null)
          setIsConnected(false)
          setAuthResult(null)
          result = { success: true }
          break
          
        case 'signMessage':
          if (!authResult) {
            throw new Error('Not authenticated')
          }
          
          // Derive the keypair for the current account
          const messageKeypair = await deriveWalletAccount(authResult.masterSeed, accountIndex)
          
          // Sign the message
          const message = typeof request.params === 'object' && 
                         'message' in (request.params as any) 
                         ? Buffer.from((request.params as any).message, 'base64')
                         : Buffer.from('test message')
          
          // Use nacl to sign (Solana uses Ed25519)
          const signature = await import('tweetnacl').then(nacl => 
            nacl.sign.detached(message, messageKeypair.secretKey)
          )
          
          result = {
            signature: Buffer.from(signature).toString('base64')
          }
          break
          
        case 'signTransaction':
          if (!authResult) {
            throw new Error('Not authenticated')
          }
          
          // Derive the keypair for signing
          const txKeypair = await deriveWalletAccount(authResult.masterSeed, accountIndex)
          
          // Parse and sign the transaction
          const txData = (request.params as any).transaction
          const tx = Transaction.from(Buffer.from(txData, 'base64'))
          tx.sign(txKeypair)
          
          result = {
            signedTransaction: tx.serialize().toString('base64')
          }
          break
          
        default:
          throw new Error(`Method ${request.method} not supported`)
      }
      
      // Send response back to the requesting domain
      const response: RpcResponse = {
        id: request.id,
        result,
        _request: request
      }
      
      messenger.send('rpc-response', response)
      setCurrentRequest(null)
      
    } catch (error: any) {
      const response: RpcResponse = {
        id: request.id,
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        },
        _request: request
      }
      
      messenger.send('rpc-response', response)
      setCurrentRequest(null)
    }
  }
  
  // Handle user actions
  function handleApprove() {
    if (!currentRequest || !messenger) return
    handleRequest(currentRequest, messenger)
  }
  
  function handleReject() {
    if (!currentRequest || !messenger) return
    
    const response: RpcResponse = {
      id: currentRequest.id,
      error: {
        code: 4001,
        message: 'User rejected the request'
      },
      _request: currentRequest
    }
    
    messenger.send('rpc-response', response)
    setCurrentRequest(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">LiquidRoute</h1>
          {isConnected && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm">Connected</span>
            </div>
          )}
        </div>
        
        {parentOrigin !== '*' && (
          <div className="mb-4 p-2 bg-white/5 rounded-lg">
            <p className="text-white/50 text-xs">
              Connected to: <span className="text-white/70">{parentOrigin}</span>
            </p>
          </div>
        )}
        
        {!passkeySupported ? (
          // Browser doesn't support passkeys
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Passkeys Not Supported</h2>
              <p className="text-white/70 text-sm">
                Your browser doesn't support passkeys. Please use a modern browser like Chrome, Edge, or Safari.
              </p>
            </div>
          </div>
        ) : !authResult ? (
          // Passkey authentication screen
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Passkey Wallet</h2>
              <p className="text-white/70 text-sm">
                Your wallet is derived from your passkey. No seed phrases needed.
              </p>
            </div>
            
            <div className="space-y-4">
              {hasPasskey ? (
                <button
                  onClick={handlePasskeyAuth}
                  disabled={isCreatingPasskey}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg disabled:opacity-50"
                >
                  {isCreatingPasskey ? '🔄 Authenticating...' : '🔐 Unlock with Passkey'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCreatePasskey}
                    disabled={isCreatingPasskey}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg disabled:opacity-50"
                  >
                    {isCreatingPasskey ? '🔄 Creating...' : '✨ Create Passkey Wallet'}
                  </button>
                  
                  <button
                    onClick={handlePasskeyAuth}
                    disabled={isCreatingPasskey}
                    className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200"
                  >
                    🔓 Use Existing Passkey
                  </button>
                </>
              )}
              
              <div className="text-center">
                <p className="text-white/50 text-xs">
                  Powered by WebAuthn PRF • True self-custody
                </p>
              </div>
            </div>
            
            {/* Show error message if any */}
            {errorMessage && (
              <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                <p className="text-red-400 text-sm text-center">
                  {errorMessage}
                </p>
              </div>
            )}
          </div>
        ) : currentRequest ? (
          // Request approval screen
          (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">
                {currentRequest.method === 'connect' && 'Connect Wallet'}
                {currentRequest.method === 'signMessage' && 'Sign Message'}
                {currentRequest.method === 'signTransaction' && 'Sign Transaction'}
                {currentRequest.method === 'disconnect' && 'Disconnect Wallet'}
              </h2>
              
              <p className="text-white/70 text-sm">
                {parentOrigin} is requesting access
              </p>
            </div>
            
            {currentRequest.method === 'connect' && (
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/70 text-sm mb-2">This app wants to:</p>
                <ul className="space-y-2 text-white text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    View your wallet address
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Request transaction signatures
                  </li>
                </ul>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200"
              >
                Reject
              </button>
              
              <button
                onClick={handleApprove}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg"
              >
                Approve
              </button>
            </div>
          </div>
          )
        ) : (
          // Wallet main screen
          <div className="space-y-6">
            {publicKey ? (
              <>
                <div className="text-center">
                  <p className="text-white/70 text-sm mb-2">Wallet Address</p>
                  <p className="text-white font-mono text-xs break-all bg-white/10 rounded-lg p-3">
                    {publicKey}
                  </p>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white/70 text-sm">Account Index</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccountChange(Math.max(0, accountIndex - 1))}
                        className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/20"
                      >
                        ←
                      </button>
                      <span className="text-white font-mono w-8 text-center">{accountIndex}</span>
                      <button
                        onClick={() => handleAccountChange(accountIndex + 1)}
                        className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/20"
                      >
                        →
                      </button>
                    </div>
                  </div>
                  <p className="text-white/50 text-xs">
                    Deterministic BIP44 derivation from passkey
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <p className="text-white/70 text-sm mb-1">Network</p>
                    <p className="text-white text-xl font-bold">QuickNode</p>
                  </div>
                  
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <p className="text-white/70 text-sm mb-1">Auth Method</p>
                    <p className="text-white text-xl font-bold">Passkey</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setAuthResult(null)
                    setPublicKey(null)
                    setIsConnected(false)
                  }}
                  className="w-full py-2 bg-white/10 text-white/70 text-sm rounded-xl hover:bg-white/20 transition-all duration-200"
                >
                  Lock Wallet
                </button>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-white/70">Passkey wallet ready</p>
                <p className="text-white/50 text-sm mt-2">Authenticate to access your wallet</p>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-white/50 text-xs">
            Passkey Wallet • True Self-Custody • Powered by WebAuthn PRF
          </p>
        </div>
      </div>
    </div>
  )
}