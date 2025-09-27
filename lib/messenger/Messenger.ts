/**
 * Cross-domain messaging system adapted from Porto
 * Handles secure communication between iframe/popup and parent window
 */

import type { Message, MessageTopic, ReadyOptions } from './types'

export type MessageListener<T = unknown> = (
  payload: T,
  event: MessageEvent
) => void

export interface Messenger {
  destroy(): void
  on<T = unknown>(
    topic: MessageTopic,
    listener: MessageListener<T>,
    id?: string
  ): () => void
  send<T = unknown>(
    topic: MessageTopic,
    payload: T,
    target?: string
  ): Promise<Message<T>>
  sendAsync<T = unknown>(
    topic: MessageTopic,
    payload: T,
    target?: string
  ): Promise<T>
}

export interface Bridge extends Messenger {
  ready(options: ReadyOptions): void
  waitForReady(): Promise<ReadyOptions>
}

/**
 * Creates a messenger from a window instance for cross-domain communication
 */
export function fromWindow(
  targetWindow: Window,
  options: { targetOrigin?: string } = {}
): Messenger {
  const { targetOrigin } = options
  const listeners = new Map<string, MessageListener>()
  
  // Safely log without accessing cross-origin properties
  let windowType = 'other'
  try {
    if (targetWindow === window) windowType = 'self'
    else if (targetWindow === window.parent) windowType = 'parent'
  } catch (e) {
    windowType = 'cross-origin'
  }
  console.log('[fromWindow] Creating messenger with targetOrigin:', targetOrigin, 'for window:', windowType)

  return {
    destroy() {
      for (const listener of listeners.values()) {
        // Always remove listeners from the current window
        window.removeEventListener('message', listener as EventListener)
      }
      listeners.clear()
    },

    on(topic, listener, id) {
      function handler(event: MessageEvent) {
        // Skip if wrong topic
        if (event.data?.topic !== topic) return
        // Skip if id specified and doesn't match
        if (id && event.data.id !== id) return
        // Validate origin if specified - CRITICAL for cross-domain security
        if (targetOrigin && targetOrigin !== '*' && event.origin !== targetOrigin) {
          console.warn(`Rejected message from ${event.origin}, expected ${targetOrigin}`)
          return
        }
        
        listener(event.data.payload, event)
      }

      // Always listen on the current window, not the target window
      window.addEventListener('message', handler)
      const key = `${topic}-${id || 'default'}`
      listeners.set(key, handler as MessageListener)
      
      return () => {
        window.removeEventListener('message', handler)
        listeners.delete(key)
      }
    },

    async send(topic, payload, target) {
      const id = crypto.randomUUID()
      const message: Message<typeof payload> = { id, topic, payload }
      
      const finalTarget = target ?? targetOrigin ?? '*'
      console.log('[Messenger] Sending message with topic:', topic, 'to origin:', finalTarget)
      
      // Never use '*' in production - always specify target origin
      targetWindow.postMessage(message, finalTarget)
      
      return message as Message<any>
    },

    async sendAsync(topic, payload, target) {
      const { id } = await this.send(topic, payload, target)
      
      return new Promise<any>((resolve) => {
        const unsubscribe = this.on(
          topic,
          (response) => {
            unsubscribe()
            resolve(response)
          },
          id
        )
      })
    }
  }
}

/**
 * Bridges two messengers for cross-window communication
 * Used to connect parent window with iframe/popup across different domains
 */
export function bridge(params: {
  from: Messenger
  to: Messenger
  waitForReady?: boolean
}): Bridge {
  const { from: fromMessenger, to, waitForReady = false } = params
  
  let readyResolve: ((options: ReadyOptions) => void) | null = null
  let readyReject: ((error: Error) => void) | null = null
  
  const readyPromise = new Promise<ReadyOptions>((resolve, reject) => {
    readyResolve = resolve
    readyReject = reject
  })

  // Listen for ready message
  fromMessenger.on('ready', (options: ReadyOptions) => {
    readyResolve?.(options)
  })

  const messenger: Messenger = {
    destroy() {
      fromMessenger.destroy()
      to.destroy()
      readyReject?.(new Error('Messenger destroyed'))
    },

    on(topic, listener, id) {
      return fromMessenger.on(topic, listener, id)
    },

    async send(topic, payload) {
      if (waitForReady && topic !== 'ready') {
        await readyPromise
      }
      return to.send(topic, payload)
    },

    async sendAsync(topic, payload) {
      if (waitForReady && topic !== 'ready') {
        await readyPromise
      }
      return to.sendAsync(topic, payload)
    }
  }

  return {
    ...messenger,
    
    ready(options) {
      void messenger.send('ready', options)
    },

    waitForReady() {
      return readyPromise
    }
  }
}
