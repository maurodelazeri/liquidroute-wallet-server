'use client'

import { useEffect, useState, useRef } from 'react'
import { PublicKey, Keypair } from '@solana/web3.js'
import nacl from 'tweetnacl'
import { Buffer } from 'buffer'

// Simple cross-domain wallet UI
export default function PortoWallet() {
  const [isIframe, setIsIframe] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [currentRequest, setCurrentRequest] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const parentOrigin = useRef<string>('*')

  useEffect(() => {
    // Check if we're in an iframe
    const inIframe = window.self !== window.top
    setIsIframe(inIframe)

    // Set up message listener for cross-domain communication
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      const trustedOrigins = [
        'https://solanavalidators.xyz',
        'http://localhost:3000',
        'http://localhost:3001'
      ]
      
      if (!trustedOrigins.includes(event.origin)) {
        console.log('Ignoring message from untrusted origin:', event.origin)
        return
      }

      parentOrigin.current = event.origin

      // Handle different message types
      const { data } = event
      
      if (data?.type === '__internal' && data?.topic === 'init') {
        // Client is ready
        console.log('Client initialized')
        return
      }

      if (data?.topic === 'rpc-requests' && Array.isArray(data.payload)) {
        const requests = data.payload
        if (requests.length > 0) {
          const request = requests[0]
          handleRpcRequest(request)
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Send ready signal
    if (inIframe && window.parent) {
      window.parent.postMessage({ topic: 'ready' }, '*')
    }

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const handleRpcRequest = (request: any) => {
    console.log('Handling RPC request:', request)
    setCurrentRequest(request)
    setError(null)

    switch (request.method) {
      case 'connect':
        // For demo, generate a random keypair
        const keypair = Keypair.generate()
        const pubkey = keypair.publicKey.toBase58()
        setPublicKey(pubkey)
        
        // Store for later use
        if (typeof window !== 'undefined') {
          localStorage.setItem('wallet_publicKey', pubkey)
          localStorage.setItem('wallet_secretKey', Buffer.from(keypair.secretKey).toString('base64'))
        }
        
        sendResponse(request.id, { publicKey: pubkey })
        setCurrentRequest(null)
        break
        
      case 'signMessage':
        // Show message for approval
        break
        
      case 'signTransaction':
        // Show transaction for approval
        break
        
      case 'disconnect':
        setPublicKey(null)
        localStorage.removeItem('wallet_publicKey')
        localStorage.removeItem('wallet_secretKey')
        sendResponse(request.id, { disconnected: true })
        setCurrentRequest(null)
        break
        
      default:
        setError(`Unsupported method: ${request.method}`)
        sendResponse(request.id, null, `Unsupported method: ${request.method}`)
        setCurrentRequest(null)
    }
  }

  const sendResponse = (id: string, result: any, error?: string) => {
    if (window.parent && parentOrigin.current) {
      const response = {
        topic: 'rpc-response',
        payload: error ? { id, error } : { id, result }
      }
      window.parent.postMessage(response, parentOrigin.current)
    }
  }

  const handleApprove = () => {
    if (!currentRequest) return

    if (currentRequest.method === 'signMessage') {
      const secretKeyBase64 = localStorage.getItem('wallet_secretKey')
      if (!secretKeyBase64) {
        setError('Wallet not found')
        return
      }
      
      const secretKey = new Uint8Array(Buffer.from(secretKeyBase64, 'base64'))
      const message = Buffer.from(currentRequest.params.message, 'base64')
      const signature = nacl.sign.detached(message, secretKey)
      
      sendResponse(currentRequest.id, {
        signature: Buffer.from(signature).toString('base64')
      })
    } else if (currentRequest.method === 'signTransaction') {
      // For demo, just return a mock signature
      sendResponse(currentRequest.id, {
        signature: Buffer.from(new Uint8Array(64)).toString('base64')
      })
    }
    
    setCurrentRequest(null)
  }

  const handleReject = () => {
    if (currentRequest) {
      sendResponse(currentRequest.id, null, 'User rejected request')
      setCurrentRequest(null)
    }
  }

  // Porto-style UI
  const portoStyles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    dialog: {
      width: '100%',
      maxWidth: '420px',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderRadius: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      overflow: 'hidden',
      backdropFilter: 'blur(20px)'
    },
    header: {
      padding: '24px',
      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    content: {
      padding: '32px 24px'
    },
    footer: {
      padding: '24px',
      borderTop: '1px solid rgba(0, 0, 0, 0.06)',
      display: 'flex',
      gap: '12px'
    },
    button: {
      flex: 1,
      padding: '12px 24px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: 600,
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    primaryButton: {
      backgroundColor: '#6366f1',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
      color: '#000'
    },
    title: {
      fontSize: '24px',
      fontWeight: 700,
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '14px',
      color: 'rgba(0, 0, 0, 0.6)',
      marginBottom: '24px'
    },
    address: {
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '8px',
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      borderRadius: '8px',
      wordBreak: 'break-all' as const
    }
  }

  // Don't show UI if not in iframe
  if (!isIframe) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>LiquidRoute Wallet</h1>
        <p>This wallet interface is designed to be embedded as an iframe.</p>
        <p>Visit <a href="https://solanavalidators.xyz">solanavalidators.xyz</a> to use it.</p>
      </div>
    )
  }

  return (
    <div style={portoStyles.overlay}>
      <div style={portoStyles.dialog}>
        <div style={portoStyles.header}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>LiquidRoute Wallet</div>
            <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.5)' }}>
              Secure Cross-Domain Wallet
            </div>
          </div>
        </div>

        <div style={portoStyles.content}>
          {error && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#fee', 
              color: '#c00',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {!currentRequest && !publicKey && (
            <div>
              <div style={portoStyles.title}>Welcome</div>
              <div style={portoStyles.subtitle}>
                Connect your wallet to continue
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.6)' }}>
                Waiting for connection request...
              </p>
            </div>
          )}

          {!currentRequest && publicKey && (
            <div>
              <div style={portoStyles.title}>Connected</div>
              <div style={portoStyles.subtitle}>
                Your wallet is connected
              </div>
              <div style={portoStyles.address}>
                {publicKey}
              </div>
            </div>
          )}

          {currentRequest?.method === 'signMessage' && (
            <div>
              <div style={portoStyles.title}>Sign Message</div>
              <div style={portoStyles.subtitle}>
                A dApp wants you to sign a message
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderRadius: '12px',
                marginTop: '16px'
              }}>
                <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.5)', marginBottom: '8px' }}>
                  Message:
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '14px', wordBreak: 'break-all' }}>
                  {currentRequest.params.message}
                </div>
              </div>
            </div>
          )}

          {currentRequest?.method === 'signTransaction' && (
            <div>
              <div style={portoStyles.title}>Approve Transaction</div>
              <div style={portoStyles.subtitle}>
                Review and approve this transaction
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderRadius: '12px',
                marginTop: '16px'
              }}>
                <div style={{ fontSize: '14px' }}>
                  Transaction details would be shown here
                </div>
              </div>
            </div>
          )}
        </div>

        {currentRequest && (
          <div style={portoStyles.footer}>
            <button
              onClick={handleReject}
              style={{ ...portoStyles.button, ...portoStyles.secondaryButton }}
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              style={{ ...portoStyles.button, ...portoStyles.primaryButton }}
            >
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
