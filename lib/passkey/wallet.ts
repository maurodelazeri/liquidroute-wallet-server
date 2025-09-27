/**
 * Passkey-based Solana wallet generation
 * Implements WebAuthn PRF for deterministic key derivation
 */

import { Keypair, PublicKey } from '@solana/web3.js'
import { sha256, hkdf, deriveAccountSeed, base64urlEncode, base64urlDecode } from './crypto'

export interface PasskeyWallet {
  publicKey: string
  accountIndex: number
  credentialId: string
}

export interface PasskeyAuthResult {
  masterSeed: Uint8Array
  credentialId: string
  wallet: PasskeyWallet
}

/**
 * Create a new passkey for wallet generation
 * Note: This requires two passkey prompts:
 * 1. First to create the passkey
 * 2. Second to authenticate and get the PRF output for wallet derivation
 */
export async function createPasskeyWallet(
  username: string,
  displayName?: string
): Promise<PasskeyAuthResult> {
  // Check WebAuthn support
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn not supported in this browser')
  }

  // Generate challenge
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  // Get the domain from window location
  const rpId = window.location.hostname === 'localhost' ? 'localhost' : 'wallet.liquidroute.com'

  // Create credential with PRF extension
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        name: 'LiquidRoute Wallet',
        id: rpId
      },
      user: {
        id: crypto.getRandomValues(new Uint8Array(32)),
        name: username,
        displayName: displayName || username
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
        requireResidentKey: true
      },
      attestation: 'none',
      extensions: {
        prf: {
          eval: {
            first: new TextEncoder().encode('liquidroute:solana:keypair:v1')
          }
        }
      } as any // PRF extension not yet in TS types
    }
  }) as PublicKeyCredential & {
    getClientExtensionResults(): any
  }

  // Check if PRF was successful
  const prfResult = credential.getClientExtensionResults().prf
  if (!prfResult?.enabled) {
    throw new Error('PRF extension not supported by authenticator')
  }

  // Step 2: We must authenticate with the newly created passkey to get the PRF output
  // The create operation only tells us PRF is enabled, but doesn't give us the output
  // This is why users see two prompts when creating a new wallet
  const credentialId = base64urlEncode(new Uint8Array(credential.rawId))
  return await authenticateWithPasskey(credentialId)
}

/**
 * Authenticate with existing passkey to recover wallet
 */
export async function authenticateWithPasskey(
  credentialId?: string
): Promise<PasskeyAuthResult> {
  // Check WebAuthn support
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn not supported in this browser')
  }

  // If no credential ID provided and we're not in a create flow, this will show
  // the browser's passkey selection dialog. If there are no passkeys, it will
  // show "No passkeys available" error
  if (!credentialId) {
    console.warn('No credential ID provided to authenticateWithPasskey - browser will show selection dialog')
  }

  // Generate challenge
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  // Get the domain
  const rpId = window.location.hostname === 'localhost' ? 'localhost' : 'wallet.liquidroute.com'

  // Prepare allowed credentials if credential ID provided
  const decoded = credentialId ? base64urlDecode(credentialId) : null
  const allowCredentials = decoded ? [{
    id: decoded.buffer.slice(decoded.byteOffset, decoded.byteOffset + decoded.byteLength) as ArrayBuffer,
    type: 'public-key' as PublicKeyCredentialType
  }] : undefined

  // Authenticate with PRF
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId,
      allowCredentials,
      userVerification: 'required',
      extensions: {
        prf: {
          eval: {
            first: new TextEncoder().encode('liquidroute:solana:keypair:v1')
          }
        }
      } as any // PRF extension
    }
  }) as PublicKeyCredential & {
    getClientExtensionResults(): any
  }

  // Get PRF result
  const prfResult = credential.getClientExtensionResults().prf
  if (!prfResult?.results?.first) {
    throw new Error('PRF extension not supported or no result')
  }

  // Extract PRF output (256 bits of entropy)
  const prfBuffer = prfResult.results.first
  const prfOutput = prfBuffer instanceof Uint8Array 
    ? prfBuffer 
    : new Uint8Array(prfBuffer as ArrayBuffer)
  
  // Master seed is first 32 bytes of PRF output
  const masterSeed = prfOutput.slice(0, 32)

  // Derive initial account (index 0)
  const accountSeed = await deriveAccountSeed(masterSeed, 0)
  const keypair = Keypair.fromSeed(accountSeed)

  return {
    masterSeed,
    credentialId: base64urlEncode(new Uint8Array(credential.rawId)),
    wallet: {
      publicKey: keypair.publicKey.toBase58(),
      accountIndex: 0,
      credentialId: base64urlEncode(new Uint8Array(credential.rawId))
    }
  }
}

/**
 * Derive wallet for specific account index
 */
export async function deriveWalletAccount(
  masterSeed: Uint8Array,
  accountIndex: number
): Promise<Keypair> {
  const accountSeed = await deriveAccountSeed(masterSeed, accountIndex)
  return Keypair.fromSeed(accountSeed)
}

/**
 * Check if passkey is available
 */
export async function isPasskeyAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    return false
  }

  try {
    // Check if platform authenticator is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    
    // Check for conditional mediation support (passkey autofill)
    const conditional = await PublicKeyCredential.isConditionalMediationAvailable?.()
    
    return available
  } catch {
    return false
  }
}

/**
 * Get stored credential ID from localStorage
 */
export function getStoredCredentialId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('liquidroute:credentialId')
}

/**
 * Store credential ID in localStorage
 */
export function storeCredentialId(credentialId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('liquidroute:credentialId', credentialId)
}
