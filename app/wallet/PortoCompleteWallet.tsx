'use client'

import { useEffect, useState, useRef } from 'react'
import { PublicKey, Keypair } from '@solana/web3.js'
import nacl from 'tweetnacl'
import { Buffer } from 'buffer'

// Import actual Porto components
import {
  Button,
  Frame,
  Input,
  Layout,
  Screen,
  Spinner,
} from './components/porto'

type RequestType = 'connect' | 'signMessage' | 'signTransaction' | null

export default function PortoCompleteWallet() {
  const [isIframe, setIsIframe] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [currentRequest, setCurrentRequest] = useState<any>(null)
  const [requestType, setRequestType] = useState<RequestType>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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
      // Simulate passkey auth with a random keypair
      const keypair = Keypair.generate()
      const pubkey = keypair.publicKey.toBase58()
      
      // Store for later use
      localStorage.setItem('wallet_publicKey', pubkey)
      localStorage.setItem('wallet_secretKey', Buffer.from(keypair.secretKey).toString('base64'))
      
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
    setRequestType(null)
  }

  const handleReject = () => {
    if (currentRequest) {
      sendResponse(currentRequest.id, null, 'User rejected request')
      setCurrentRequest(null)
      setRequestType(null)
    }
  }

  // Don't show UI if not in iframe
  if (!isIframe) {
    return (
      <Frame mode="dialog" colorScheme="light">
        <Screen>
          <Layout.Header>
            <Layout.Header.Default
              title="LiquidRoute Wallet"
              content="This wallet interface is designed to be embedded as an iframe."
              subContent={
                <span>
                  Visit{' '}
                  <a 
                    href="https://solanavalidators.xyz" 
                    style={{ color: '#6366f1', textDecoration: 'underline' }}
                  >
                    solanavalidators.xyz
                  </a>
                  {' '}to use it.
                </span>
              }
            />
          </Layout.Header>
        </Screen>
      </Frame>
    )
  }

  // Welcome screen - Connect wallet
  if (requestType === 'connect' && !publicKey) {
    return (
      <Frame 
        mode="dialog" 
        colorScheme="light"
        site={{
          name: 'LiquidRoute',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEyIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXIpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXIiIHgxPSIwIiB5MT0iMCIgeDI9IjI0IiB5Mj0iMjQiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4=',
          verified: true
        }}
      >
        <Screen layout="compact">
          <Layout.Header>
            <Layout.Header.Default
              title="Welcome to LiquidRoute"
              content="Create or connect your wallet to continue"
              variant="info"
            />
          </Layout.Header>
          
          {error && (
            <div style={{
              padding: 12,
              margin: '0 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 8,
              color: '#ef4444',
              fontSize: 14
            }}>
              {error}
            </div>
          )}
          
          <Layout.Footer.Actions>
            <Button
              variant="primary"
              size="large"
              width="full"
              loading={loading}
              onClick={handleConnect}
            >
              Continue with Passkey
            </Button>
          </Layout.Footer.Actions>
        </Screen>
      </Frame>
    )
  }

  // Connected state - Show account
  if (publicKey && !currentRequest) {
    return (
      <Frame 
        mode="dialog" 
        colorScheme="light"
        site={{
          name: 'LiquidRoute',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEyIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXIpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXIiIHgxPSIwIiB5MT0iMCIgeDI9IjI0IiB5Mj0iMjQiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4=',
          verified: true
        }}
      >
        <Screen layout="compact">
          <Layout.Header>
            <Layout.Header.Default
              title="Wallet Connected"
              content="Your wallet is ready to use"
              variant="success"
            />
          </Layout.Header>
          
          <Layout.Footer.Account 
            address={publicKey}
            onPress={handleDisconnect}
          />
        </Screen>
      </Frame>
    )
  }

  // Sign Message request
  if (requestType === 'signMessage' && currentRequest) {
    return (
      <Frame 
        mode="dialog" 
        colorScheme="light"
        onClose={handleReject}
        site={{
          name: 'LiquidRoute',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEyIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXIpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnRgaWQ9InBhaW50MF9saW5lYXIiIHgxPSIwIiB5MT0iMCIgeDI9IjI0IiB5Mj0iMjQiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4=',
          verified: true
        }}
      >
        <Screen layout="compact">
          <Layout.Header>
            <Layout.Header.Default
              title="Sign Message"
              content="A dApp wants you to sign a message"
              variant="info"
            />
          </Layout.Header>
          
          <div style={{
            margin: '0 12px',
            padding: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 12,
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.5)', marginBottom: 8 }}>
              Message:
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, wordBreak: 'break-all' }}>
              {currentRequest.params.message}
            </div>
          </div>
          
          <Layout.Footer.Actions>
            <Button
              variant="secondary"
              size="large"
              width="full"
              onClick={handleReject}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="large"
              width="full"
              onClick={handleApprove}
            >
              Sign
            </Button>
          </Layout.Footer.Actions>
        </Screen>
      </Frame>
    )
  }

  // Sign Transaction request
  if (requestType === 'signTransaction' && currentRequest) {
    return (
      <Frame 
        mode="dialog" 
        colorScheme="light"
        onClose={handleReject}
        site={{
          name: 'LiquidRoute',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEyIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXIpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXIiIHgxPSIwIiB5MT0iMCIgeDI9IjI0IiB5Mj0iMjQiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4=',
          verified: true
        }}
      >
        <Screen layout="compact">
          <Layout.Header>
            <Layout.Header.Default
              title="Approve Transaction"
              content="Review and approve this transaction"
              variant="warning"
            />
          </Layout.Header>
          
          <div style={{
            margin: '0 12px',
            padding: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 12,
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: 14, marginBottom: 12 }}>
              Transaction Details
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 13,
              color: 'rgba(0, 0, 0, 0.7)'
            }}>
              <div>• Transfer SOL</div>
              <div>• Interact with program</div>
              <div>• Pay network fees</div>
            </div>
          </div>
          
          <Layout.Footer.Actions>
            <Button
              variant="secondary"
              size="large"
              width="full"
              onClick={handleReject}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="large"
              width="full"
              onClick={handleApprove}
            >
              Approve
            </Button>
          </Layout.Footer.Actions>
        </Screen>
      </Frame>
    )
  }

  // Default state - waiting for request
  return (
    <Frame 
      mode="dialog" 
      colorScheme="light"
      site={{
        name: 'LiquidRoute',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEyIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXIpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXIiIHgxPSIwIiB5MT0iMCIgeDI9IjI0IiB5Mj0iMjQiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4=',
        verified: true
      }}
    >
      <Screen layout="compact">
        <Layout.Header>
          <Layout.Header.Default
            title="LiquidRoute Wallet"
            content="Waiting for requests..."
          />
        </Layout.Header>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: 40 
        }}>
          <Spinner size="large" />
        </div>
      </Screen>
    </Frame>
  )
}
