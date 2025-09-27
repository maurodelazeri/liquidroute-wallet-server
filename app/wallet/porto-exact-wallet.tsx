'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createPasskeyWallet, authenticateWithPasskey } from '@/lib/passkey/wallet'
import { fromWindow as MessengerFromWindow } from '@/lib/messenger/Messenger'
import type { RpcRequest, RpcResponse } from '@/lib/messenger/types'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import * as nacl from 'tweetnacl'
import './porto-dialog.css'
import './porto-theme-exact.css'

export default function PortoExactWallet() {
  const initRef = useRef(false)
  const messengerRef = useRef<ReturnType<typeof MessengerFromWindow> | null>(null)
  const [isIframe, setIsIframe] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentRequest, setCurrentRequest] = useState<RpcRequest | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)

  // Porto's exact HTML and body setup
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    
    // Set Porto's exact styles for transparent background
    document.documentElement.style.backgroundColor = 'transparent'
    document.documentElement.classList.add('bg-transparent')
    document.body.style.backgroundColor = 'transparent'
    document.body.style.height = '100%'
    document.body.classList.add('text-base')
    
    // Porto's root setup
    const root = document.getElementById('root')
    if (root) {
      root.style.display = 'flex'
      root.style.width = '100%'
      root.style.maxWidth = '100vw'
      root.style.height = '100%'
      root.style.overflowX = 'hidden'
    }

    // Check iframe and setup messenger
    let inIframe = false
    try {
      inIframe = window.self !== window.top
    } catch (e) {
      inIframe = true
    }
    setIsIframe(inIframe)
    
    const storedCredentialId = localStorage.getItem('liquidroute_credential_id')
    const storedPublicKey = localStorage.getItem('liquidroute_public_key')
    if (storedCredentialId && storedPublicKey) {
      setPublicKey(storedPublicKey)
    }

    if (inIframe) {
      const messenger = MessengerFromWindow(window.parent as Window, {})
      messengerRef.current = messenger
      messenger.send('ready', {})

      messenger.on('rpc-requests', async (requests: RpcRequest[]) => {
        if (!Array.isArray(requests) || requests.length === 0) return
        const request = requests[0]
        console.log('[Wallet] Received RPC request:', request)
        
        if (request.method === 'connect') {
          if (storedPublicKey) {
            const response: RpcResponse = {
              id: request.id,
              result: { publicKey: storedPublicKey, connected: true },
              _request: request
            }
            messenger.send('rpc-response', response)
            messenger.send('close', {})
          } else {
            setCurrentRequest(request)
          }
        } else {
          setCurrentRequest(request)
        }
      })

      return () => messenger.destroy()
    }
  }, [])

  const handleApprove = async () => {
    if (!currentRequest || !publicKey) return
    
    setIsProcessing(true)
    try {
      const seedBase64 = localStorage.getItem(`seed_${publicKey}`)
      if (!seedBase64) throw new Error('No seed found')
      
      const seed = Buffer.from(seedBase64, 'base64')
      const keypair = nacl.sign.keyPair.fromSeed(new Uint8Array(seed.slice(0, 32)))
      
      let response: RpcResponse
      if (currentRequest.method === 'signMessage') {
        const message = currentRequest.params?.[0]?.message
        const signature = nacl.sign.detached(
          Buffer.from(message, 'utf8'),
          keypair.secretKey
        )
        response = {
          id: currentRequest.id,
          result: { signature: Buffer.from(signature).toString('base64') },
          _request: currentRequest
        }
      } else if (currentRequest.method === 'signTransaction') {
        // For demo, just return success
        response = {
          id: currentRequest.id,
          result: { success: true },
          _request: currentRequest
        }
      } else {
        response = {
          id: currentRequest.id,
          result: null,
          _request: currentRequest
        }
      }
      
      messengerRef.current?.send('rpc-response', response)
      messengerRef.current?.send('close', {})
      setCurrentRequest(null)
    } catch (err: any) {
      console.error('[Wallet] Error signing:', err)
      setError(err.message)
    }
    setIsProcessing(false)
  }
  
  const handleReject = () => {
    if (!currentRequest) return
    const response: RpcResponse = {
      id: currentRequest.id,
      error: { code: 4001, message: 'User rejected the request' },
      _request: currentRequest
    }
    messengerRef.current?.send('rpc-response', response)
    messengerRef.current?.send('close', {})
    setCurrentRequest(null)
  }

  // Porto's exact Frame structure with transparent overlay
  return (
    <div 
      data-dialog="true"
      style={{
        containerType: 'inline-size',
        display: 'grid',
        height: '100%',
        placeItems: 'center',
        position: 'relative',
        width: '100%',
        background: 'transparent'
      }}
    >
      <div style={{
        display: 'grid',
        height: '100%',
        overflowX: 'auto',
        overflowY: 'auto',
        width: '100%',
        placeItems: 'start center'
      }}>
        {/* Porto's exact overlay - semi-transparent black */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          inset: 0,
          position: 'fixed',
          backdropFilter: 'blur(4px)'
        }} />
        
        {/* Porto's exact dialog card */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: '360px',
          position: 'relative',
          width: '100%',
          backgroundColor: 'var(--background-color-th_base)',
          border: '1px solid var(--border-color-th_frame)',
          borderRadius: 'var(--radius-th_frame)',
          flex: 1,
          overflow: 'hidden',
          maxWidth: '360px',
          top: '16px',
          animation: 'enter 150ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Porto's exact frame bar */}
          <div style={{
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color-th_frame)',
            color: 'var(--text-color-th_frame)',
            display: 'flex',
            flex: '0 0 auto',
            justifyContent: 'space-between',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            width: '100%',
            backgroundColor: 'var(--background-color-th_frame)',
            height: '33px'
          }}>
            <div style={{
              alignItems: 'center',
              display: 'flex',
              flex: 1,
              minWidth: 0,
              paddingInline: '12px',
              gap: '8px',
              fontSize: '13px'
            }}>
              <div style={{
                borderRadius: 'var(--radius-th_small)',
                height: '20px',
                width: '20px',
                overflow: 'hidden',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }} />
              <div>LiquidRoute</div>
            </div>
          </div>
          
          {/* Porto's exact content area */}
          <div style={{
            display: 'flex',
            flex: '1 0 auto',
            justifyContent: 'center',
            width: '100%',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              width: '100%'
            }}>
              {currentRequest?.method === 'signMessage' ? (
                // Sign message UI
                <>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    margin: 0,
                    textAlign: 'center',
                    color: 'var(--text-color-th_base)'
                  }}>
                    Sign Message
                  </h2>
                  
                  <div style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--background-color-th_container)',
                    borderRadius: 'var(--radius-th_medium)',
                    border: '1px solid var(--border-color-th_base)'
                  }}>
                    <pre style={{
                      margin: 0,
                      fontSize: '14px',
                      color: 'var(--text-color-th_base)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {currentRequest.params?.[0]?.message || 'No message'}
                    </pre>
                  </div>
                  
                  {error && (
                    <div style={{
                      color: 'var(--text-color-th_base-negative)',
                      fontSize: '14px',
                      textAlign: 'center',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background-color-th_badge-negative)',
                      borderRadius: 'var(--radius-th_medium)',
                      width: '100%'
                    }}>
                      {error}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button 
                      onClick={handleReject}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        backgroundColor: 'var(--background-color-th_container)',
                        border: '1px solid var(--border-color-th_base)',
                        borderRadius: '21px',
                        color: 'var(--text-color-th_base)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        fontSize: '16px',
                        height: '42px',
                        justifyContent: 'center',
                        fontWeight: 500
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleApprove}
                      disabled={isProcessing}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        backgroundColor: 'var(--background-color-th_primary)',
                        border: '1px solid var(--border-color-th_primary)',
                        borderRadius: '21px',
                        color: 'var(--text-color-th_primary)',
                        cursor: isProcessing ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        fontSize: '16px',
                        height: '42px',
                        justifyContent: 'center',
                        fontWeight: 500,
                        opacity: isProcessing ? 0.7 : 1
                      }}
                    >
                      {isProcessing ? 'Signing...' : 'Sign'}
                    </button>
                  </div>
                </>
              ) : currentRequest?.method === 'signTransaction' ? (
                // Sign transaction UI
                <>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    margin: 0,
                    textAlign: 'center',
                    color: 'var(--text-color-th_base)'
                  }}>
                    Approve Transaction
                  </h2>
                  
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-color-th_base-secondary)',
                    margin: 0,
                    textAlign: 'center'
                  }}>
                    Review and approve the transaction
                  </p>
                  
                  {error && (
                    <div style={{
                      color: 'var(--text-color-th_base-negative)',
                      fontSize: '14px',
                      textAlign: 'center',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background-color-th_badge-negative)',
                      borderRadius: 'var(--radius-th_medium)',
                      width: '100%'
                    }}>
                      {error}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button 
                      onClick={handleReject}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        backgroundColor: 'var(--background-color-th_container)',
                        border: '1px solid var(--border-color-th_base)',
                        borderRadius: '21px',
                        color: 'var(--text-color-th_base)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        fontSize: '16px',
                        height: '42px',
                        justifyContent: 'center',
                        fontWeight: 500
                      }}
                    >
                      Reject
                    </button>
                    <button 
                      onClick={handleApprove}
                      disabled={isProcessing}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        backgroundColor: 'var(--background-color-th_primary)',
                        border: '1px solid var(--border-color-th_primary)',
                        borderRadius: '21px',
                        color: 'var(--text-color-th_primary)',
                        cursor: isProcessing ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        fontSize: '16px',
                        height: '42px',
                        justifyContent: 'center',
                        fontWeight: 500,
                        opacity: isProcessing ? 0.7 : 1
                      }}
                    >
                      {isProcessing ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                </>
              ) : (
                // Welcome/Auth UI
                <>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    margin: 0,
                    textAlign: 'center',
                    color: 'var(--text-color-th_base)'
                  }}>
                    Welcome to LiquidRoute
                  </h2>
                  
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-color-th_base-secondary)',
                    margin: 0,
                    textAlign: 'center'
                  }}>
                    Sign in with your passkey
                  </p>
                  
                  {error && (
                    <div style={{
                      color: 'var(--text-color-th_base-negative)',
                      fontSize: '14px',
                      textAlign: 'center',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background-color-th_badge-negative)',
                      borderRadius: 'var(--radius-th_medium)',
                      width: '100%'
                    }}>
                      {error}
                    </div>
                  )}
                  
                  <button 
                    onClick={async () => {
                  try {
                    setIsProcessing(true)
                    setError(null)
                    
                    const storedCredentialId = localStorage.getItem('liquidroute_credential_id')
                    let authResult
                    
                    if (!storedCredentialId) {
                      authResult = await createPasskeyWallet('LiquidRoute Wallet')
                      localStorage.setItem('liquidroute_credential_id', authResult.credentialId)
                      localStorage.setItem('liquidroute_public_key', authResult.wallet.publicKey)
                      localStorage.setItem(`seed_${authResult.wallet.publicKey}`, Buffer.from(authResult.masterSeed).toString('base64'))
                    } else {
                      try {
                        authResult = await authenticateWithPasskey(storedCredentialId)
                        localStorage.setItem(`seed_${authResult.wallet.publicKey}`, Buffer.from(authResult.masterSeed).toString('base64'))
                      } catch (err: any) {
                        if (err.message?.includes('No passkeys') || err.message?.includes('not found')) {
                          authResult = await createPasskeyWallet('LiquidRoute Wallet')
                          localStorage.setItem('liquidroute_credential_id', authResult.credentialId)
                          localStorage.setItem('liquidroute_public_key', authResult.wallet.publicKey)
                          localStorage.setItem(`seed_${authResult.wallet.publicKey}`, Buffer.from(authResult.masterSeed).toString('base64'))
                        } else {
                          throw err
                        }
                      }
                    }
                    
                    setPublicKey(authResult.wallet.publicKey)
                    
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
                }}
                disabled={isProcessing}
                style={{
                  alignItems: 'center',
                  backgroundColor: 'var(--background-color-th_primary)',
                  border: '1px solid var(--border-color-th_primary)',
                  borderRadius: '21px',
                  color: 'var(--text-color-th_primary)',
                  cursor: isProcessing ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  fontSize: '16px',
                  height: '42px',
                  justifyContent: 'center',
                  paddingInline: '20px',
                  width: '100%',
                  fontWeight: 500,
                  opacity: isProcessing ? 0.7 : 1
                }}
              >
                {isProcessing ? 'Processing...' : 'Continue with Passkey'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
