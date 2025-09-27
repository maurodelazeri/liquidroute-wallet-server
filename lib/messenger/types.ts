/**
 * Cross-domain messaging types adapted from Porto
 * Chain-agnostic messaging for iframe/popup communication
 */

export type MessageTopic = 
  | 'ready'
  | 'close'
  | 'rpc-request'
  | 'rpc-requests'  // Porto uses plural for batched requests
  | 'rpc-response'
  | 'success'
  | '__internal'

export type ReadyOptions = {
  chainIds: readonly string[]
  methodPolicies?: readonly MethodPolicy[]
  trustedHosts?: readonly string[]
}

export type MethodPolicy = {
  method: string
  modes?: {
    dialog?: boolean | { sameOrigin: boolean }
    headless?: boolean | { sameOrigin: boolean }
  }
  requireConnection?: boolean
}

export type InternalPayload = 
  | {
      type: 'init'
      chainIds?: readonly string[] | undefined
      mode: 'iframe' | 'popup' | 'inline-iframe' | 'page'
      referrer: {
        icon?: string | undefined
        title: string
      }
      theme?: any
    }
  | {
      type: 'resize'
      height?: number | undefined
      width?: number | undefined
    }
  | {
      type: 'set-theme'
      theme: any
    }

export type RpcRequest = {
  id: string
  method: string
  params?: unknown
}

export type RpcResponse = {
  id: string
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
  _request: RpcRequest
}

export interface Message<T = unknown> {
  id: string
  topic: MessageTopic
  payload: T
}
