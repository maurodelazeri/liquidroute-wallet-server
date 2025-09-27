'use client'

import { useState, useEffect, useRef } from 'react'
import { Keypair } from '@solana/web3.js'
import { fromWindow, bridge, type Bridge } from '@/lib/messenger/Messenger'
import type { RpcRequest, RpcResponse } from '@/lib/messenger/types'
import { config, isTrustedOrigin } from '@/lib/config'

export default function WalletPage() {
  const [messenger, setMessenger] = useState<Bridge | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [currentRequest, setCurrentRequest] = useState<RpcRequest | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [parentOrigin, setParentOrigin] = useState<string>('*')
  const messengerRef = useRef<Bridge | null>(null)
  
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
      // Validate that this is from a trusted origin (can be completely different domain)
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
        chainIds: ['mainnet-beta', 'testnet', 'devnet'],
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
  
  // Handle RPC requests from different domains
  async function handleRequest(request: RpcRequest, messenger: Bridge) {
    try {
      let result: any
      
      switch (request.method) {
        case 'connect':
          // For demo, generate a random keypair
          // In production, would use secure key management
          if (!publicKey) {
            const keypair = Keypair.generate()
            const pubKey = keypair.publicKey.toBase58()
            setPublicKey(pubKey)
            setIsConnected(true)
            result = { publicKey: pubKey }
          } else {
            result = { publicKey }
          }
          break
          
        case 'disconnect':
          setPublicKey(null)
          setIsConnected(false)
          result = { success: true }
          break
          
        case 'signMessage':
          // Would show UI for user to approve
          result = {
            signature: Buffer.from('mock-signature').toString('base64')
          }
          break
          
        case 'signTransaction':
          // Would show transaction details for approval
          result = {
            signedTransaction: 'mock-signed-transaction'
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
        
        {!isUnlocked ? (
          // Lock screen
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Welcome Back</h2>
              <p className="text-white/70 text-sm">Enter your password to unlock</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              />
              
              <button
                onClick={() => setIsUnlocked(true)}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg"
              >
                Unlock
              </button>
            </div>
          </div>
        ) : currentRequest ? (
          // Request approval screen
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <p className="text-white/70 text-sm mb-1">Balance</p>
                    <p className="text-white text-2xl font-bold">0 SOL</p>
                  </div>
                  
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <p className="text-white/70 text-sm mb-1">Network</p>
                    <p className="text-white text-2xl font-bold">Mainnet</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-white/70">No wallet connected</p>
                <p className="text-white/50 text-sm mt-2">Connect from an app to get started</p>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-white/50 text-xs">
            Cross-Domain Solana Wallet • Powered by LiquidRoute
          </p>
        </div>
      </div>
    </div>
  )
}
