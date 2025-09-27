'use client'

// Porto's EXACT dialog structure and styling - directly copied and adapted
import React, { useEffect, useRef, useState } from 'react'
import { createPasskeyWallet, authenticateWithPasskey } from '@/lib/passkey/wallet'
import { fromWindow as MessengerFromWindow } from '@/lib/messenger/Messenger'
import type { RpcRequest, RpcResponse } from '@/lib/messenger/types'
import * as nacl from 'tweetnacl'

// Import Porto's exact CSS
import './styles.css'
import './porto-theme.css'
import './index.css'

export default function PortoExactClean() {
  const initRef = useRef(false)
  const messengerRef = useRef<ReturnType<typeof MessengerFromWindow> | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentRequest, setCurrentRequest] = useState<RpcRequest | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    // Porto's exact body setup from dialog app
    document.documentElement.classList.add('bg-transparent')
    document.body.classList.add('text-base', 'antialiased', 'overflow-hidden')
    
    let inIframe = false
    try {
      inIframe = window.self !== window.top
    } catch (e) {
      inIframe = true
    }
    
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
      } else {
        response = {
          id: currentRequest.id,
          result: { success: true },
          _request: currentRequest
        }
      }
      
      messengerRef.current?.send('rpc-response', response)
      messengerRef.current?.send('close', {})
      setCurrentRequest(null)
    } catch (err: any) {
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

  const handlePasskeyAuth = async () => {
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
      setError(err.message || 'Authentication failed')
      setIsProcessing(false)
    }
  }

  // Porto's EXACT HTML structure from __root.tsx and dialog components
  return (
    <div 
      data-dialog="true"
      style={{
        containerType: 'inline-size',
        display: 'grid',
        height: '100%',
        placeItems: 'center',
        position: 'relative',
        width: '100%'
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
        {/* Porto's exact overlay */}
        <div 
          onClick={() => messengerRef.current?.send('close', {})}
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            inset: 0,
            position: 'fixed',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }} 
        />
        
        {/* Porto's exact dialog */}
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
            {messengerRef.current && (
              <button
                onClick={() => messengerRef.current?.send('close', {})}
                style={{
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-color-th_frame)',
                  cursor: 'pointer',
                  display: 'flex',
                  height: '33px',
                  justifyContent: 'center',
                  padding: 0,
                  width: '33px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          
          {/* Porto's exact content area */}
          <div style={{
            display: 'flex',
            flex: '1 0 auto',
            flexDirection: 'column',
            minHeight: 0,
            position: 'relative',
            width: '100%'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%'
            }}>
              {currentRequest?.method === 'signMessage' ? (
                <>
                  {/* Porto's SignMessage layout */}
                  <div className="flex flex-col p-3 pb-2">
                    <div className="flex flex-col gap-3 pb-1">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-th_badge-info text-th_badge-info">
                          <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                        </div>
                        <div className="font-medium text-[18px] text-th_base">Sign Message</div>
                      </div>
                      <div className="text-[15px] text-th_base leading-[22px]">
                        The application is requesting you to sign this message
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-grow px-3 pb-[12px]">
                    <div style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'var(--background-color-th_container)',
                      borderRadius: 'var(--radius-th_medium)',
                      border: '1px solid var(--border-color-th_base)',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      color: 'var(--text-color-th_base)',
                      wordBreak: 'break-word'
                    }}>
                      {currentRequest.params?.[0]?.message || 'No message'}
                    </div>
                  </div>
                  
                  <div className="flex min-h-[48px] w-full flex-col items-center justify-center space-y-3 pb-3">
                    <div className="flex w-full gap-2 px-3">
                      {/* Porto's exact button styles */}
                      <button 
                        onClick={handleReject}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          backgroundColor: 'var(--background-color-th_secondary)',
                          border: '1px solid var(--border-color-th_secondary)',
                          borderRadius: 'var(--radius-th_medium)',
                          color: 'var(--text-color-th_secondary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          fontSize: '16px',
                          height: '40px',
                          justifyContent: 'center',
                          fontWeight: 500,
                          whiteSpace: 'nowrap'
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
                          borderRadius: 'var(--radius-th_medium)',
                          color: 'var(--text-color-th_primary)',
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          fontSize: '16px',
                          height: '40px',
                          justifyContent: 'center',
                          fontWeight: 500,
                          opacity: isProcessing ? 0.6 : 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isProcessing ? 'Signing...' : 'Sign'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Porto's SignIn/Connect layout */}
                  <div className="flex flex-col p-3 pb-2">
                    <div className="flex flex-col gap-3 pb-1">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-th_badge-info text-th_badge-info">
                          <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                            <polyline points="10 17 15 12 10 7"/>
                            <line x1="15" y1="12" x2="3" y2="12"/>
                          </svg>
                        </div>
                        <div className="font-medium text-[18px] text-th_base">Get started</div>
                      </div>
                      <div className="text-[15px] text-th_base leading-[22px]">
                        Authenticate with your LiquidRoute account to start using{' '}
                        <span className="font-medium">this website</span>.
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-grow px-3 pb-[12px]">
                    {error && (
                      <div style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: 'var(--background-color-th_badge-negative)',
                        borderRadius: 'var(--radius-th_medium)',
                        color: 'var(--text-color-th_badge-negative)',
                        fontSize: '14px',
                        marginBottom: '12px'
                      }}>
                        {error}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex min-h-[48px] w-full flex-col items-center justify-center space-y-3 pb-3">
                    <div className="flex w-full gap-2 px-3">
                      <button 
                        onClick={handlePasskeyAuth}
                        disabled={isProcessing}
                        style={{
                          width: '100%',
                          alignItems: 'center',
                          backgroundColor: 'var(--background-color-th_primary)',
                          border: '1px solid var(--border-color-th_primary)',
                          borderRadius: 'var(--radius-th_medium)',
                          color: 'var(--text-color-th_primary)',
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          fontSize: '16px',
                          height: '40px',
                          justifyContent: 'center',
                          fontWeight: 500,
                          opacity: isProcessing ? 0.6 : 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isProcessing ? 'Processing...' : 'Sign in'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes enter {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
