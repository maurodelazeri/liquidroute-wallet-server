// Cross-domain message types
export type MessageTopic = 
  | 'ready'
  | 'close'
  | 'rpc-request'
  | 'rpc-requests'  // Porto uses plural for batched requests
  | 'rpc-response'
  | 'success'
  | '__internal'

// Message structure
export interface Message<T = unknown> {
  id?: string
  topic: MessageTopic
  payload?: T
}

// Ready signal options
export interface ReadyOptions {
  chainIds?: string[]
  trustedHosts?: string[]
}

// Base RPC request/response types
export interface RpcRequest {
  id: string | number
  method: string
  params?: any
  chainId?: string
}

export interface RpcResponse {
  id: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
  _request?: RpcRequest
}

// Solana-specific RPC method types
export type SolanaRpcMethod = 
  | 'connect'
  | 'disconnect' 
  | 'signMessage'
  | 'signTransaction'
  | 'signAllTransactions'
  | 'sendTransaction'
  | 'wallet_sendCalls'
  | 'wallet_prepareCalls'
  | 'wallet_sendPreparedCalls'
  | 'wallet_getCapabilities'
  | 'wallet_getAssets'
  | 'wallet_grantPermissions'
  | 'wallet_revokePermissions'
  | 'wallet_getPermissions'
  | 'wallet_addFunds'
  | 'wallet_simulateTransaction'
  | 'wallet_getCallsStatus'

// Detailed parameter types for each method
export namespace RpcParams {
  export interface Connect {
    // Optional parameters for connection
  }

  export interface SignMessage {
    message: string // Base64 encoded message
    display?: 'utf8' | 'hex' // How to display to user
  }

  export interface SignTransaction {
    transaction: string // Base64 encoded transaction
    version?: number // 0 for versioned, undefined for legacy
    skipPreflight?: boolean
  }

  export interface SignAllTransactions {
    transactions: string[] // Array of base64 encoded transactions
  }

  export interface SendTransaction {
    transaction: string
    options?: {
      skipPreflight?: boolean
      maxRetries?: number
      priorityFee?: number // in microLamports
      computeUnits?: number
      waitForConfirmation?: boolean
    }
  }

  export interface SendCalls {
    calls: SolanaCall[]
    from?: string
    chainId?: string
    capabilities?: {
      priorityFee?: number
      computeUnits?: number
      requiredFunds?: RequiredFund[]
    }
  }

  export interface PrepareCalls {
    calls: SolanaCall[]
    from: string
    chainId?: string
    priorityFee?: number
    computeUnits?: number
  }

  export interface SendPreparedCalls {
    message: string // Base64 encoded message
    signature: string // Base64 encoded signature
    context: any
  }

  export interface GetAssets {
    account: string
    chainId?: string
  }

  export interface GrantPermissions {
    programs?: string[] // Allowed program IDs
    methods?: string[] // Allowed RPC methods
    maxAmount?: string // Max transaction amount in SOL
    autoApprove?: boolean
    expiresAt?: number // Unix timestamp
    sessionKey?: boolean // Generate a session key
  }

  export interface RevokePermissions {
    id: string // Permission ID
  }

  export interface AddFunds {
    account: string
    amount?: string // Desired amount in SOL
    token?: string // Token mint address (optional)
  }

  export interface SimulateTransaction {
    transaction: string // Base64 encoded transaction
  }

  export interface GetCallsStatus {
    id: string // Transaction signature or bundle ID
  }
}

// Solana instruction format
export interface SolanaCall {
  programId: string
  accounts: {
    pubkey: string
    isSigner: boolean
    isWritable: boolean
  }[]
  data?: string // Base64 encoded instruction data
  computeUnits?: number
  priorityFee?: number
}

// Required funds specification
export interface RequiredFund {
  token?: string // Token mint address, undefined for SOL
  amount: string
  symbol: string
}

// Response types
export namespace RpcResults {
  export interface Connect {
    publicKey: string
    chainId: string
  }

  export interface SignMessage {
    signature: string
    publicKey: string
  }

  export interface SignTransaction {
    signedTransaction: string
  }

  export interface SignAllTransactions {
    signedTransactions: string[]
  }

  export interface SendTransaction {
    signature: string
  }

  export interface SendCalls {
    id: string // Transaction signature or bundle ID
    status: 'pending' | 'confirmed' | 'failed'
  }

  export interface PrepareCalls {
    message: Uint8Array
    blockhash: string
    context: {
      slot: number
      computeUnits?: number
      priorityFee?: number
    }
    requiredSignatures: string[]
  }

  export interface GetCapabilities {
    chains: string[]
    features: {
      signMessage: boolean
      signTransaction: boolean
      signAllTransactions: boolean
      sendTransaction: boolean
      versioned: boolean
      priorityFees: boolean
      sessionKeys: boolean
      batchedTransactions: boolean
      tokenOperations: boolean
      swapIntegration: boolean
    }
    permissions: {
      autoApprove?: string[]
      maxTransactionValue?: string
      dailyLimit?: string
    }
  }

  export interface GetAssets {
    assets: Asset[]
  }

  export interface GrantPermissions {
    id: string
    grantedAt: number
    expiresAt?: number
    scope: any
    sessionKey?: string // Public key if session key was generated
  }

  export interface GetPermissions {
    permissions: Permission[]
  }

  export interface AddFunds {
    method: 'deposit' | 'purchase' | 'swap'
    address?: string
    url?: string
    providers?: { name: string; url: string }[]
  }

  export interface SimulateTransaction {
    success: boolean
    error?: any
    logs?: string[]
    unitsConsumed?: number
  }

  export interface GetCallsStatus {
    status: 'pending' | 'confirmed' | 'failed'
    signature?: string
    error?: string
    receipts?: any[]
  }
}

// Asset type
export interface Asset {
  type: 'native' | 'token' | 'nft'
  symbol: string
  name: string
  address?: string // Mint address for tokens
  balance: string
  decimals: number
  icon?: string
  usdValue?: string
}

// Permission type
export interface Permission {
  id: string
  grantedAt: number
  expiresAt?: number
  scope: {
    programs?: string[]
    methods?: string[]
    maxAmount?: string
    autoApprove?: boolean
  }
  origin: string
}