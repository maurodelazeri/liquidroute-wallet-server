/**
 * Cryptographic utilities for passkey wallet generation
 * Based on WebSig's approach using WebAuthn PRF extension
 */

/**
 * SHA-256 hash function
 */
export async function sha256(data: Uint8Array | string): Promise<Uint8Array> {
  const buffer = typeof data === 'string' 
    ? new TextEncoder().encode(data).buffer
    : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return new Uint8Array(hashBuffer)
}

/**
 * HKDF-SHA256 key derivation function
 * Used for deterministic key derivation from passkey
 */
export async function hkdf(
  secret: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number = 32
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    secret.buffer.slice(secret.byteOffset, secret.byteOffset + secret.byteLength) as ArrayBuffer,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  )
  
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer,
      info: info.buffer.slice(info.byteOffset, info.byteOffset + info.byteLength) as ArrayBuffer
    },
    key,
    length * 8
  )
  
  return new Uint8Array(bits)
}

/**
 * BIP44-inspired account derivation
 * Derives account-specific seeds from master seed
 */
export async function deriveAccountSeed(
  masterSeed: Uint8Array,
  accountIndex: number
): Promise<Uint8Array> {
  const path = `m/44'/501'/${accountIndex}'/0'/0'`
  const salt = new TextEncoder().encode(`solana-bip44-${path}`)
  const info = new TextEncoder().encode('liquidroute:account:v1')
  return await hkdf(masterSeed, salt, info, 32)
}

/**
 * Base64URL encoding utilities
 */
export function base64urlEncode(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function base64urlDecode(b64u: string): Uint8Array {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((2 - (b64u.length * 3) % 4) % 4)
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}
