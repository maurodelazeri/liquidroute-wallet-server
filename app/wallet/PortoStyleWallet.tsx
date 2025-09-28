'use client'

import { useEffect, useState, useRef } from 'react'

type RequestType = 'connect' | 'signMessage' | 'signTransaction' | null

export default function PortoStyleWallet() {
  const [isIframe, setIsIframe] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [currentRequest, setCurrentRequest] = useState<any>(null)
  const [requestType, setRequestType] = useState<RequestType>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const parentOrigin = useRef<string>('*')

  useEffect(() => {
    // Check if we're in an iframe
    const inIframe = window.self !== window.top
    setIsIframe(inIframe)

    // Load stored public key if exists
    const storedPubKey = localStorage.getItem('wallet_publicKey')
    if (storedPubKey) {
      setPublicKey(storedPubKey)
    }

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
        setIsVisible(true)
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
      setTimeout(() => {
        window.parent.postMessage({ topic: 'ready' }, '*')
      }, 100)
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
        setRequestType('connect')
        if (publicKey) {
          // Already connected, return existing wallet
          sendResponse(request.id, { publicKey })
          setCurrentRequest(null)
          setRequestType(null)
        }
        break
        
      case 'signMessage':
        setRequestType('signMessage')
        break
        
      case 'signTransaction':
        setRequestType('signTransaction')
        break
        
      case 'disconnect':
        handleDisconnect()
        sendResponse(request.id, { disconnected: true })
        setCurrentRequest(null)
        setRequestType(null)
        break
        
      default:
        setError(`Unsupported method: ${request.method}`)
        sendResponse(request.id, null, `Unsupported method: ${request.method}`)
        setCurrentRequest(null)
        setRequestType(null)
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

  const handleConnect = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Generate a random wallet address for demo
      const randomBytes = new Uint8Array(32)
      crypto.getRandomValues(randomBytes)
      
      // Simple base64 encoding for demo
      const pubkey = btoa(String.fromCharCode(...randomBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .slice(0, 44) // Typical Solana address length
      
      // Store for later use
      localStorage.setItem('wallet_publicKey', pubkey)
      localStorage.setItem('wallet_secretKey', btoa(String.fromCharCode(...randomBytes)))
      
      setPublicKey(pubkey)
      
      if (currentRequest) {
        sendResponse(currentRequest.id, { publicKey: pubkey })
      }
      
      setCurrentRequest(null)
      setRequestType(null)
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    setPublicKey(null)
    localStorage.removeItem('wallet_publicKey')
    localStorage.removeItem('wallet_secretKey')
    setRequestType(null)
  }

  const handleApprove = () => {
    if (!currentRequest) return

    if (currentRequest.method === 'signMessage') {
      // For demo, just return a mock signature
      const mockSignature = new Uint8Array(64)
      crypto.getRandomValues(mockSignature)
      
      sendResponse(currentRequest.id, {
        signature: btoa(String.fromCharCode(...mockSignature))
      })
    } else if (currentRequest.method === 'signTransaction') {
      // For demo, just return a mock signature
      sendResponse(currentRequest.id, {
        signature: btoa(String.fromCharCode(...new Uint8Array(64)))
      })
    }
    
    setCurrentRequest(null)
    setRequestType(null)
  }

  const handleReject = () => {
    if (currentRequest) {
      sendResponse(currentRequest.id, null, 'User rejected request')
      setCurrentRequest(null)
      setRequestType(null)
    }
  }

  // Porto-style CSS
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    display: 'grid',
    placeItems: 'center',
    padding: '24px',
    animation: isVisible ? 'fadeIn 0.2s ease-out' : 'fadeOut 0.2s ease-out',
    opacity: isVisible ? 1 : 0,
  }

  const dialogStyles: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    maxWidth: '440px',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    border: '1px solid rgba(0, 0, 0, 0.08)',
  }

  const headerStyles: React.CSSProperties = {
    alignItems: 'center',
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
    display: 'flex',
    height: '56px',
    padding: '0 20px',
    position: 'relative',
    flexShrink: 0,
  }

  const contentStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '32px 24px',
  }

  const buttonStyles: React.CSSProperties = {
    alignItems: 'center',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    fontSize: '16px',
    fontWeight: '600',
    height: '48px',
    justifyContent: 'center',
    width: '100%',
    transition: 'all 0.2s',
  }

  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'transparent',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    color: '#000',
  }

  // Don't show UI if not in iframe
  if (!isIframe) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>LiquidRoute Wallet</h1>
          <p style={{ color: '#666' }}>This wallet interface is designed to be embedded as an iframe.</p>
          <p style={{ marginTop: '8px' }}>
            Visit{' '}
            <a 
              href="https://solanavalidators.xyz" 
              style={{ color: '#6366f1', textDecoration: 'underline' }}
            >
              solanavalidators.xyz
            </a>
            {' '}to use it.
          </p>
        </div>
      </div>
    )
  }

  // Add styles to head
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(10px);
        }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      body {
        margin: 0;
        background: transparent;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <>
      
      <div style={overlayStyles}>
        <div style={dialogStyles}>
          {/* Porto-style header */}
          <div style={headerStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              {/* Site icon */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
              }}>
                L
              </div>
              
              {/* Site name and verification */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {parentOrigin.current === 'https://solanavalidators.xyz' 
                      ? 'solanavalidators.xyz'
                      : 'LiquidRoute'}
                  </span>
                  {/* Verification badge */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#22c55e">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" fill="#22c55e"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleReject}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div style={contentStyles}>
            {/* Default/Waiting state */}
            {!currentRequest && !requestType && (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '12px', fontWeight: '600' }}>
                  Waiting for requests...
                </h2>
                <div style={{ 
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  border: '3px solid rgba(99, 102, 241, 0.2)',
                  borderTopColor: '#6366f1',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}>
                </div>
              </div>
            )}

            {/* Connect wallet */}
            {requestType === 'connect' && !publicKey && (
              <div>
                <h2 style={{ fontSize: '20px', marginBottom: '12px', fontWeight: '600' }}>
                  Create or connect your wallet to continue
                </h2>
                
                {error && (
                  <div style={{
                    padding: '12px',
                    marginBottom: '16px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}
                
                <button
                  style={buttonStyles}
                  onClick={handleConnect}
                  disabled={loading}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#5558e3'
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#6366f1'
                  }}
                >
                  {loading ? 'Authenticating...' : 'Continue with Passkey'}
                </button>
              </div>
            )}

            {/* Connected state */}
            {publicKey && !currentRequest && (
              <div>
                <h2 style={{ fontSize: '20px', marginBottom: '12px', fontWeight: '600' }}>
                  Wallet Connected
                </h2>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '12px',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Public Key
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '14px', wordBreak: 'break-all' }}>
                    {publicKey.slice(0, 20)}...{publicKey.slice(-20)}
                  </div>
                </div>
              </div>
            )}

            {/* Sign message */}
            {requestType === 'signMessage' && currentRequest && (
              <div>
                <h2 style={{ fontSize: '20px', marginBottom: '12px', fontWeight: '600' }}>
                  Sign Message
                </h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  A dApp wants you to sign a message
                </p>
                
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  marginBottom: '24px',
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    Message:
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '14px', wordBreak: 'break-all' }}>
                    {currentRequest.params.message}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    style={secondaryButtonStyles}
                    onClick={handleReject}
                  >
                    Cancel
                  </button>
                  <button
                    style={buttonStyles}
                    onClick={handleApprove}
                  >
                    Sign
                  </button>
                </div>
              </div>
            )}

            {/* Sign transaction */}
            {requestType === 'signTransaction' && currentRequest && (
              <div>
                <h2 style={{ fontSize: '20px', marginBottom: '12px', fontWeight: '600' }}>
                  Approve Transaction
                </h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Review and approve this transaction
                </p>
                
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(251, 146, 60, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(251, 146, 60, 0.2)',
                  marginBottom: '24px',
                }}>
                  <div style={{ fontSize: '14px', marginBottom: '12px', fontWeight: '500' }}>
                    Transaction Details
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <div>• Transfer SOL</div>
                    <div>• Interact with program</div>
                    <div>• Pay network fees</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    style={secondaryButtonStyles}
                    onClick={handleReject}
                  >
                    Reject
                  </button>
                  <button
                    style={buttonStyles}
                    onClick={handleApprove}
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
