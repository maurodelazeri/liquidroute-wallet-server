import { 
  Transaction, 
  VersionedTransaction, 
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
  Connection,
  Keypair
} from '@solana/web3.js'
import type { PasskeyAuthResult } from '../passkey/wallet'
import { deriveWalletAccount } from '../passkey/wallet'
import * as nacl from 'tweetnacl'

// RPC method types
export type RpcMethod = 
  | 'connect'
  | 'disconnect' 
  | 'signMessage'
  | 'signTransaction'
  | 'signAllTransactions'
  | 'sendTransaction'
  | 'wallet_sendCalls'
  | 'wallet_prepareCalls'
  | 'wallet_getCapabilities'
  | 'wallet_getAssets'
  | 'wallet_grantPermissions'
  | 'wallet_revokePermissions'
  | 'wallet_getPermissions'
  | 'wallet_addFunds'
  | 'wallet_simulateTransaction'

// Capability types
export interface WalletCapabilities {
  chains: string[] // ['solana:mainnet', 'solana:devnet']
  features: {
    signMessage: boolean
    signTransaction: boolean
    signAllTransactions: boolean
    sendTransaction: boolean
    versioned: boolean // Supports versioned transactions
    priorityFees: boolean
    sessionKeys: boolean
    batchedTransactions: boolean
    tokenOperations: boolean
    swapIntegration: boolean
  }
  permissions: {
    autoApprove?: string[] // Program IDs that can be auto-approved
    maxTransactionValue?: string // Max SOL value per transaction
    dailyLimit?: string // Daily spending limit in SOL
  }
}

// Asset types for SPL tokens and NFTs
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

// Permission types
export interface Permission {
  id: string
  grantedAt: number
  expiresAt?: number
  scope: {
    programs?: string[] // Allowed program IDs
    methods?: RpcMethod[] // Allowed RPC methods
    maxAmount?: string // Max transaction amount
    autoApprove?: boolean
  }
  origin: string // Domain that requested permission
}

// Solana call format for batch operations
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

// Prepare calls response
export interface PrepareCallsResponse {
  message: Uint8Array // Transaction message to sign
  blockhash: string
  context: {
    slot: number
    computeUnits?: number
    priorityFee?: number
  }
  requiredSignatures: string[] // Public keys that must sign
}

// RPC handlers
export class SolanaWalletRPC {
  private connection: Connection
  private permissions: Map<string, Permission> = new Map()
  private sessionKeys: Map<string, Keypair> = new Map()

  constructor(rpcEndpoint: string) {
    this.connection = new Connection(rpcEndpoint, 'confirmed')
  }

  async handleRequest(
    method: RpcMethod,
    params: any,
    authResult?: PasskeyAuthResult,
    origin?: string
  ): Promise<any> {
    switch (method) {
      case 'connect':
        return this.connect(params, authResult)
      
      case 'disconnect':
        return this.disconnect()
      
      case 'signMessage':
        return this.signMessage(params, authResult)
      
      case 'signTransaction':
        return this.signTransaction(params, authResult)
        
      case 'signAllTransactions':
        return this.signAllTransactions(params, authResult)
      
      case 'sendTransaction':
        return this.sendTransaction(params, authResult)
      
      case 'wallet_sendCalls':
        return this.sendCalls(params, authResult)
        
      case 'wallet_prepareCalls':
        return this.prepareCalls(params)
        
      case 'wallet_getCapabilities':
        return this.getCapabilities(params)
        
      case 'wallet_getAssets':
        return this.getAssets(params)
        
      case 'wallet_grantPermissions':
        return this.grantPermissions(params, origin)
        
      case 'wallet_revokePermissions':
        return this.revokePermissions(params)
        
      case 'wallet_getPermissions':
        return this.getPermissions()
        
      case 'wallet_addFunds':
        return this.addFunds(params)
        
      case 'wallet_simulateTransaction':
        return this.simulateTransaction(params)
        
      default:
        throw new Error(`Method ${method} not supported`)
    }
  }

  private async connect(params: any, authResult?: PasskeyAuthResult) {
    if (!authResult) throw new Error('Not authenticated')
    return { 
      publicKey: authResult.wallet.publicKey,
      chainId: 'solana:mainnet'
    }
  }

  private async disconnect() {
    return { success: true }
  }

  private async signMessage(params: any, authResult?: PasskeyAuthResult) {
    if (!authResult) throw new Error('Not authenticated')
    
    const message = Buffer.from(params.message || '', 'base64')
    const keypair = await deriveWalletAccount(authResult.masterSeed, 0)
    const signature = nacl.sign.detached(message, keypair.secretKey)
    
    return { 
      signature: Buffer.from(signature).toString('base64'),
      publicKey: keypair.publicKey.toBase58()
    }
  }

  private async signTransaction(params: any, authResult?: PasskeyAuthResult) {
    if (!authResult) throw new Error('Not authenticated')
    
    const keypair = await deriveWalletAccount(authResult.masterSeed, 0)
    const txData = params.transaction
    
    // Handle both legacy and versioned transactions
    let transaction: Transaction | VersionedTransaction
    
    if (params.version === 0 || txData.version === 0) {
      // Versioned transaction
      transaction = VersionedTransaction.deserialize(Buffer.from(txData, 'base64'))
      transaction.sign([keypair])
    } else {
      // Legacy transaction
      transaction = Transaction.from(Buffer.from(txData, 'base64'))
      transaction.sign(keypair)
    }
    
    return { 
      signedTransaction: Buffer.from(transaction.serialize()).toString('base64')
    }
  }

  private async signAllTransactions(params: any, authResult?: PasskeyAuthResult) {
    if (!authResult) throw new Error('Not authenticated')
    
    const keypair = await deriveWalletAccount(authResult.masterSeed, 0)
    const transactions = params.transactions || []
    
    const signedTransactions = await Promise.all(
      transactions.map(async (txData: string) => {
        const tx = Transaction.from(Buffer.from(txData, 'base64'))
        tx.sign(keypair)
        return Buffer.from(tx.serialize()).toString('base64')
      })
    )
    
    return { signedTransactions }
  }

  private async sendTransaction(params: any, authResult?: PasskeyAuthResult) {
    if (!authResult) throw new Error('Not authenticated')
    
    const keypair = await deriveWalletAccount(authResult.masterSeed, 0)
    const transaction = Transaction.from(Buffer.from(params.transaction, 'base64'))
    
    // Add priority fee if specified
    if (params.priorityFee) {
      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: params.priorityFee
      })
      transaction.add(computeBudgetIx)
    }
    
    // Add compute units if specified
    if (params.computeUnits) {
      const computeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: params.computeUnits
      })
      transaction.add(computeUnitsIx)
    }
    
    transaction.sign(keypair)
    
    const signature = await this.connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: params.skipPreflight || false,
        maxRetries: params.maxRetries || 3
      }
    )
    
    if (params.waitForConfirmation) {
      await this.connection.confirmTransaction(signature, 'confirmed')
    }
    
    return { signature }
  }

  private async sendCalls(params: any, authResult?: PasskeyAuthResult) {
    if (!authResult) throw new Error('Not authenticated')
    
    const keypair = await deriveWalletAccount(authResult.masterSeed, 0)
    const calls: SolanaCall[] = params.calls || []
    
    // Build transaction from calls
    const transaction = new Transaction()
    
    // Add priority fee if specified globally
    if (params.priorityFee) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: params.priorityFee
        })
      )
    }
    
    // Add compute units if specified globally
    if (params.computeUnits) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: params.computeUnits
        })
      )
    }
    
    // Add each call as an instruction
    for (const call of calls) {
      const programId = new PublicKey(call.programId)
      const keys = call.accounts.map(acc => ({
        pubkey: new PublicKey(acc.pubkey),
        isSigner: acc.isSigner,
        isWritable: acc.isWritable
      }))
      
      transaction.add({
        programId,
        keys,
        data: call.data ? Buffer.from(call.data, 'base64') : Buffer.alloc(0)
      })
    }
    
    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = keypair.publicKey
    
    // Sign and send
    transaction.sign(keypair)
    const signature = await this.connection.sendRawTransaction(
      transaction.serialize(),
      { skipPreflight: false }
    )
    
    return { 
      id: signature,
      status: 'pending'
    }
  }

  private async prepareCalls(params: any): Promise<PrepareCallsResponse> {
    const calls: SolanaCall[] = params.calls || []
    const from = new PublicKey(params.from)
    
    // Build transaction from calls
    const transaction = new Transaction()
    
    // Add compute budget instructions if needed
    const totalComputeUnits = calls.reduce((sum, call) => 
      sum + (call.computeUnits || 200_000), 0
    )
    
    const maxPriorityFee = Math.max(
      ...calls.map(call => call.priorityFee || 0),
      params.priorityFee || 0
    )
    
    if (maxPriorityFee > 0) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: maxPriorityFee
        })
      )
    }
    
    if (totalComputeUnits > 200_000) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: Math.min(totalComputeUnits, 1_400_000)
        })
      )
    }
    
    // Add each call as an instruction
    for (const call of calls) {
      const programId = new PublicKey(call.programId)
      const keys = call.accounts.map(acc => ({
        pubkey: new PublicKey(acc.pubkey),
        isSigner: acc.isSigner,
        isWritable: acc.isWritable
      }))
      
      transaction.add({
        programId,
        keys,
        data: call.data ? Buffer.from(call.data, 'base64') : Buffer.alloc(0)
      })
    }
    
    // Get recent blockhash and slot
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
    const slot = await this.connection.getSlot()
    
    transaction.recentBlockhash = blockhash
    transaction.feePayer = from
    
    // Serialize the message for signing
    const message = transaction.serializeMessage()
    
    return {
      message,
      blockhash,
      context: {
        slot,
        computeUnits: totalComputeUnits,
        priorityFee: maxPriorityFee
      },
      requiredSignatures: [from.toBase58()]
    }
  }

  private async getCapabilities(params?: any): Promise<WalletCapabilities> {
    const chainId = params?.chainId || 'solana:mainnet'
    
    return {
      chains: ['solana:mainnet', 'solana:devnet', 'solana:testnet'],
      features: {
        signMessage: true,
        signTransaction: true,
        signAllTransactions: true,
        sendTransaction: true,
        versioned: true, // We support versioned transactions
        priorityFees: true,
        sessionKeys: true,
        batchedTransactions: true,
        tokenOperations: true,
        swapIntegration: true // Ready for Jupiter, Raydium, etc.
      },
      permissions: {
        autoApprove: [], // Can be configured per app
        maxTransactionValue: '10', // Default 10 SOL limit
        dailyLimit: '100' // Default 100 SOL daily limit
      }
    }
  }

  private async getAssets(params: any): Promise<Asset[]> {
    const account = params.account
    if (!account) throw new Error('Account address required')
    
    const pubkey = new PublicKey(account)
    
    // Get SOL balance
    const balance = await this.connection.getBalance(pubkey)
    
    // Get token accounts (simplified - in production would use getParsedTokenAccountsByOwner)
    const assets: Asset[] = [
      {
        type: 'native',
        symbol: 'SOL',
        name: 'Solana',
        balance: (balance / 1e9).toString(),
        decimals: 9,
        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
      }
    ]
    
    // TODO: Add SPL token detection
    // const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(pubkey, {
    //   programId: TOKEN_PROGRAM_ID
    // })
    
    return assets
  }

  private async grantPermissions(params: any, origin?: string): Promise<Permission> {
    const permission: Permission = {
      id: Buffer.from(nacl.randomBytes(16)).toString('hex'),
      grantedAt: Date.now(),
      expiresAt: params.expiresAt,
      scope: {
        programs: params.programs,
        methods: params.methods,
        maxAmount: params.maxAmount,
        autoApprove: params.autoApprove
      },
      origin: origin || 'unknown'
    }
    
    this.permissions.set(permission.id, permission)
    
    // If session key requested, generate one
    if (params.sessionKey) {
      const sessionKeypair = Keypair.generate()
      this.sessionKeys.set(permission.id, sessionKeypair)
      return {
        ...permission,
        sessionKey: sessionKeypair.publicKey.toBase58()
      } as any
    }
    
    return permission
  }

  private async revokePermissions(params: any) {
    const { id } = params
    this.permissions.delete(id)
    this.sessionKeys.delete(id)
    return { success: true }
  }

  private async getPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values())
  }

  private async addFunds(params: any) {
    // This would integrate with onramp providers
    // For now, return deposit instructions
    return {
      method: 'deposit',
      address: params.account,
      network: 'solana:mainnet',
      providers: [
        { name: 'MoonPay', url: 'https://moonpay.com' },
        { name: 'Ramp', url: 'https://ramp.network' },
        { name: 'Coinbase', url: 'https://coinbase.com' }
      ]
    }
  }

  private async simulateTransaction(params: any) {
    const transaction = Transaction.from(Buffer.from(params.transaction, 'base64'))
    
    const simulation = await this.connection.simulateTransaction(transaction)
    
    return {
      success: !simulation.value.err,
      error: simulation.value.err,
      logs: simulation.value.logs,
      unitsConsumed: simulation.value.unitsConsumed
    }
  }
}
