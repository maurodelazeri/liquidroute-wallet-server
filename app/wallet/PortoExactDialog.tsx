'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPasskeyWallet, authenticateWithPasskey } from '@/lib/passkey/wallet'
import { fromWindow as MessengerFromWindow } from '@/lib/messenger/Messenger'
import type { RpcRequest, RpcResponse } from '@/lib/messenger/types'
import * as nacl from 'tweetnacl'
import Frame from './components/Frame'
import './globals.css'

export default function PortoExactDialog() {
  const initRef = useRef(false)
  const messengerRef = useRef<ReturnType<typeof MessengerFromWindow> | null>(null)
  const [isIframe, setIsIframe] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentRequest, setCurrentRequest] = useState<RpcRequest | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [display, setDisplay] = useState<'floating' | 'drawer' | 'full'>('floating')

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    // Check iframe and setup messenger
    let inIframe = false
    try {
      inIframe = window.self !== window.top
    } catch (e) {
      inIframe = true
    }
    setIsIframe(inIframe)
    
    // Set display mode based on window width
    const updateDisplay = () => {
      setDisplay(window.innerWidth > 460 ? 'floating' : 'drawer')
    }
    updateDisplay()
    window.addEventListener('resize', updateDisplay)
    
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
      
      // Listen for parent iframe width
      messenger.on('__internal', (payload: any) => {
        if (payload.type === 'resize' && payload.width !== undefined) {
          setDisplay(payload.width > 460 ? 'floating' : 'drawer')
        }
      })

      return () => {
        window.removeEventListener('resize', updateDisplay)
        messenger.destroy()
      }
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
      console.error('[Wallet] Passkey auth error:', err)
      setError(err.message || 'Authentication failed')
      setIsProcessing(false)
    }
  }

  // Content to render inside the Frame
  const renderContent = () => {
    if (currentRequest?.method === 'signMessage') {
      return (
        <div className="flex h-full w-full flex-col">
          <div className="flex flex-col flex-grow items-center justify-center gap-4 px-6">
            <h2 className="text-[20px] font-semibold text-th_base">
              Sign Message
            </h2>
            
            <div className="w-full rounded-[var(--radius-th_medium)] border border-th_base bg-th_container p-3">
              <pre className="text-[14px] text-th_base whitespace-pre-wrap break-words">
                {currentRequest.params?.[0]?.message || 'No message'}
              </pre>
            </div>
            
            {error && (
              <div className="w-full rounded-[var(--radius-th_medium)] bg-th_badge-negative p-2 text-center text-[14px] text-th_base-negative">
                {error}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 px-6 pb-6">
            <button 
              onClick={handleReject}
              className="flex-1 rounded-[21px] border border-th_base bg-th_container px-5 py-2 text-[16px] font-medium text-th_base hover:opacity-80"
            >
              Cancel
            </button>
            <button 
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 rounded-[21px] border border-th_primary bg-th_primary px-5 py-2 text-[16px] font-medium text-th_primary hover:opacity-80 disabled:opacity-70"
            >
              {isProcessing ? 'Signing...' : 'Sign'}
            </button>
          </div>
        </div>
      )
    }
    
    if (currentRequest?.method === 'signTransaction') {
      return (
        <div className="flex h-full w-full flex-col">
          <div className="flex flex-col flex-grow items-center justify-center gap-4 px-6">
            <h2 className="text-[20px] font-semibold text-th_base">
              Approve Transaction
            </h2>
            
            <p className="text-[14px] text-th_base-secondary">
              Review and approve the transaction
            </p>
            
            {error && (
              <div className="w-full rounded-[var(--radius-th_medium)] bg-th_badge-negative p-2 text-center text-[14px] text-th_base-negative">
                {error}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 px-6 pb-6">
            <button 
              onClick={handleReject}
              className="flex-1 rounded-[21px] border border-th_base bg-th_container px-5 py-2 text-[16px] font-medium text-th_base hover:opacity-80"
            >
              Reject
            </button>
            <button 
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 rounded-[21px] border border-th_primary bg-th_primary px-5 py-2 text-[16px] font-medium text-th_primary hover:opacity-80 disabled:opacity-70"
            >
              {isProcessing ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </div>
      )
    }
    
    // Welcome/Auth screen
    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex flex-col flex-grow items-center justify-center gap-4 px-6">
          <h2 className="text-[20px] font-semibold text-th_base">
            Welcome to LiquidRoute
          </h2>
          
          <p className="text-[14px] text-th_base-secondary">
            Sign in with your passkey
          </p>
          
          {error && (
            <div className="w-full rounded-[var(--radius-th_medium)] bg-th_badge-negative p-2 text-center text-[14px] text-th_base-negative">
              {error}
            </div>
          )}
          
          <button 
            onClick={handlePasskeyAuth}
            disabled={isProcessing}
            className="w-full rounded-[21px] border border-th_primary bg-th_primary px-5 py-[10px] text-[16px] font-medium text-th_primary hover:opacity-80 disabled:opacity-70"
          >
            {isProcessing ? 'Processing...' : 'Continue with Passkey'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <Frame
      colorScheme="light-dark"
      mode={
        display === 'full'
          ? { name: 'full', variant: 'auto' }
          : { name: 'dialog', variant: display }
      }
      onClose={() => {
        if (messengerRef.current && isIframe) {
          messengerRef.current.send('close', {})
        }
      }}
      site={{
        icon: undefined,
        label: <div className="text-[14px] text-th_frame">LiquidRoute</div>,
        tag: undefined,
        verified: false
      }}
      visible
    >
      {renderContent()}
    </Frame>
  )
}
