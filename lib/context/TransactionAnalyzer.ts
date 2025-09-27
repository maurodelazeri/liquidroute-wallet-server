import { PublicKey } from '@solana/web3.js'

export type TransactionContext = 
  | 'swap'
  | 'nft-mint'
  | 'payment'
  | 'transfer'
  | 'approve'
  | 'stake'
  | 'defi'
  | 'generic'

export interface ContextMetadata {
  type: TransactionContext
  details: any
  confidence: number // 0-1 score of how confident we are
}

// Known program IDs for context detection
const KNOWN_PROGRAMS = {
  // DEX/Swap Programs
  JUPITER: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  RAYDIUM_V4: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  ORCA_WHIRLPOOL: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  
  // NFT Programs
  METAPLEX_TOKEN_METADATA: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  CANDY_MACHINE_V3: 'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR',
  MAGIC_EDEN_V2: 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K',
  
  // Staking Programs  
  MARINADE: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7Uu',
  SOLANA_STAKE: 'Stake11111111111111111111111111111111111111',
  
  // DeFi Programs
  SOLEND: 'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo',
  MANGO: 'mv3ekLzLbnVPNxPaoUE5oq1strMKZAk4hYqjxa8aZfX',
  
  // Payment/Commerce
  SOLANA_PAY: 'Pay11111111111111111111111111111111111111111',
  
  // Token Programs
  TOKEN_PROGRAM: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  TOKEN_2022: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
}

export class TransactionAnalyzer {
  static analyzeTransaction(params: any): ContextMetadata {
    // Check for swap operations
    if (this.isSwapTransaction(params)) {
      return this.getSwapContext(params)
    }
    
    // Check for NFT minting
    if (this.isNFTMintTransaction(params)) {
      return this.getNFTContext(params)
    }
    
    // Check for payment/commerce
    if (this.isPaymentTransaction(params)) {
      return this.getPaymentContext(params)
    }
    
    // Check for token approval
    if (this.isApprovalTransaction(params)) {
      return this.getApprovalContext(params)
    }
    
    // Check for staking
    if (this.isStakingTransaction(params)) {
      return this.getStakingContext(params)
    }
    
    // Check for DeFi operations
    if (this.isDeFiTransaction(params)) {
      return this.getDeFiContext(params)
    }
    
    // Check for simple transfer
    if (this.isTransferTransaction(params)) {
      return this.getTransferContext(params)
    }
    
    // Default to generic
    return {
      type: 'generic',
      details: {},
      confidence: 0.5
    }
  }
  
  private static isSwapTransaction(params: any): boolean {
    if (!params.calls && !params.transaction) return false
    
    // Check for swap program IDs
    const swapPrograms = [
      KNOWN_PROGRAMS.JUPITER,
      KNOWN_PROGRAMS.RAYDIUM_V4,
      KNOWN_PROGRAMS.ORCA_WHIRLPOOL
    ]
    
    // Check calls for swap programs
    if (params.calls) {
      return params.calls.some((call: any) => 
        swapPrograms.includes(call.programId)
      )
    }
    
    // Check transaction metadata
    if (params.metadata?.type === 'swap') return true
    if (params.metadata?.program?.includes('swap')) return true
    
    return false
  }
  
  private static getSwapContext(params: any): ContextMetadata {
    // Extract swap details from params
    const metadata = params.metadata || {}
    
    return {
      type: 'swap',
      details: {
        fromToken: metadata.fromToken || {
          symbol: 'SOL',
          amount: '1.0',
          icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
        },
        toToken: metadata.toToken || {
          symbol: 'USDC',
          amount: '165.50',
          icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
        },
        rate: metadata.rate || '165.50',
        priceImpact: metadata.priceImpact || '0.02%',
        route: metadata.route || this.detectSwapRoute(params),
        slippage: metadata.slippage || '0.5%'
      },
      confidence: 0.95
    }
  }
  
  private static isNFTMintTransaction(params: any): boolean {
    if (!params.calls && !params.transaction) return false
    
    // Check for NFT program IDs
    const nftPrograms = [
      KNOWN_PROGRAMS.METAPLEX_TOKEN_METADATA,
      KNOWN_PROGRAMS.CANDY_MACHINE_V3,
      KNOWN_PROGRAMS.MAGIC_EDEN_V2
    ]
    
    // Check calls for NFT programs
    if (params.calls) {
      return params.calls.some((call: any) => 
        nftPrograms.includes(call.programId)
      )
    }
    
    // Check metadata
    if (params.metadata?.type === 'nft-mint') return true
    if (params.metadata?.action === 'mint') return true
    
    return false
  }
  
  private static getNFTContext(params: any): ContextMetadata {
    const metadata = params.metadata || {}
    
    return {
      type: 'nft-mint',
      details: {
        collection: metadata.collection || {
          name: 'Unknown Collection',
          verified: false
        },
        nft: metadata.nft || {
          name: 'NFT #1',
          image: metadata.image || '',
          description: metadata.description,
          attributes: metadata.attributes
        },
        price: metadata.price || {
          amount: '1.0',
          currency: 'SOL'
        },
        supply: metadata.supply
      },
      confidence: 0.9
    }
  }
  
  private static isPaymentTransaction(params: any): boolean {
    // Check for payment metadata
    if (params.metadata?.type === 'payment') return true
    if (params.metadata?.merchant) return true
    if (params.metadata?.invoice) return true
    
    // Check for Solana Pay program
    if (params.calls) {
      return params.calls.some((call: any) => 
        call.programId === KNOWN_PROGRAMS.SOLANA_PAY
      )
    }
    
    return false
  }
  
  private static getPaymentContext(params: any): ContextMetadata {
    const metadata = params.metadata || {}
    
    return {
      type: 'payment',
      details: {
        merchant: metadata.merchant || {
          name: 'Unknown Merchant',
          verified: false
        },
        items: metadata.items,
        summary: metadata.summary || {
          total: metadata.amount || '0',
          currency: 'SOL'
        },
        shippingAddress: metadata.shippingAddress
      },
      confidence: 0.85
    }
  }
  
  private static isApprovalTransaction(params: any): boolean {
    // Check for approve instruction in token program
    if (params.calls) {
      return params.calls.some((call: any) => {
        if (call.programId === KNOWN_PROGRAMS.TOKEN_PROGRAM || 
            call.programId === KNOWN_PROGRAMS.TOKEN_2022) {
          // Check for approve instruction (instruction index 4)
          return call.data && this.isApproveInstruction(call.data)
        }
        return false
      })
    }
    
    if (params.metadata?.type === 'approve') return true
    
    return false
  }
  
  private static getApprovalContext(params: any): ContextMetadata {
    const metadata = params.metadata || {}
    
    return {
      type: 'approve',
      details: {
        token: metadata.token || { symbol: 'Unknown', address: '' },
        spender: metadata.spender || 'Unknown',
        amount: metadata.amount || 'Unlimited',
        isInfinite: metadata.isInfinite !== false
      },
      confidence: 0.8
    }
  }
  
  private static isStakingTransaction(params: any): boolean {
    if (!params.calls) return false
    
    const stakingPrograms = [
      KNOWN_PROGRAMS.MARINADE,
      KNOWN_PROGRAMS.SOLANA_STAKE
    ]
    
    return params.calls.some((call: any) => 
      stakingPrograms.includes(call.programId)
    )
  }
  
  private static getStakingContext(params: any): ContextMetadata {
    return {
      type: 'stake',
      details: {
        action: params.metadata?.action || 'stake',
        amount: params.metadata?.amount || '0',
        validator: params.metadata?.validator,
        apy: params.metadata?.apy
      },
      confidence: 0.85
    }
  }
  
  private static isDeFiTransaction(params: any): boolean {
    if (!params.calls) return false
    
    const defiPrograms = [
      KNOWN_PROGRAMS.SOLEND,
      KNOWN_PROGRAMS.MANGO
    ]
    
    return params.calls.some((call: any) => 
      defiPrograms.includes(call.programId)
    )
  }
  
  private static getDeFiContext(params: any): ContextMetadata {
    return {
      type: 'defi',
      details: {
        protocol: params.metadata?.protocol || 'Unknown Protocol',
        action: params.metadata?.action || 'interact',
        details: params.metadata
      },
      confidence: 0.75
    }
  }
  
  private static isTransferTransaction(params: any): boolean {
    // Simple SOL transfer or SPL token transfer
    if (params.calls) {
      return params.calls.some((call: any) => 
        call.programId === '11111111111111111111111111111111' || // System program
        call.programId === KNOWN_PROGRAMS.TOKEN_PROGRAM
      )
    }
    
    return params.metadata?.type === 'transfer'
  }
  
  private static getTransferContext(params: any): ContextMetadata {
    const metadata = params.metadata || {}
    
    return {
      type: 'transfer',
      details: {
        to: metadata.to || 'Unknown',
        amount: metadata.amount || '0',
        token: metadata.token || { symbol: 'SOL' }
      },
      confidence: 0.9
    }
  }
  
  private static detectSwapRoute(params: any): string {
    if (!params.calls) return 'Unknown'
    
    // Detect which DEX is being used
    for (const call of params.calls) {
      if (call.programId === KNOWN_PROGRAMS.JUPITER) return 'Jupiter'
      if (call.programId === KNOWN_PROGRAMS.RAYDIUM_V4) return 'Raydium'
      if (call.programId === KNOWN_PROGRAMS.ORCA_WHIRLPOOL) return 'Orca'
    }
    
    return 'Unknown'
  }
  
  private static isApproveInstruction(data: string): boolean {
    // SPL Token approve instruction has index 4
    // The first byte should be 4 for approve
    try {
      const decoded = Buffer.from(data, 'base64')
      return decoded.length > 0 && decoded[0] === 4
    } catch {
      return false
    }
  }
}
