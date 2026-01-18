import nacl from 'tweetnacl';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * Derive an encryption key from a Solana keypair
 * Uses the secret key to derive a symmetric encryption key
 */
export function deriveEncryptionKey(keypair: Keypair): Uint8Array {
  // Use first 32 bytes of secret key hash as encryption key
  const hash = nacl.hash(keypair.secretKey);
  return hash.slice(0, 32);
}

/**
 * Encrypt data using NaCl secretbox
 */
export function encrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const encrypted = nacl.secretbox(data, nonce, key);

  // Prepend nonce to encrypted data
  const result = new Uint8Array(nonce.length + encrypted.length);
  result.set(nonce);
  result.set(encrypted, nonce.length);

  return result;
}

/**
 * Decrypt data using NaCl secretbox
 */
export function decrypt(encryptedData: Uint8Array, key: Uint8Array): Uint8Array | null {
  const nonce = encryptedData.slice(0, nacl.secretbox.nonceLength);
  const ciphertext = encryptedData.slice(nacl.secretbox.nonceLength);

  return nacl.secretbox.open(ciphertext, nonce, key);
}

/**
 * Generate a shared encryption key for collaborators using Diffie-Hellman
 */
export function generateSharedKey(
  mySecretKey: Uint8Array,
  theirPublicKey: Uint8Array
): Uint8Array {
  // Convert Ed25519 keys to X25519 for key exchange
  const myX25519Secret = ed25519SecretKeyToX25519(mySecretKey);
  const theirX25519Public = ed25519PublicKeyToX25519(theirPublicKey);

  return nacl.box.before(theirX25519Public, myX25519Secret);
}

/**
 * Convert Ed25519 secret key to X25519
 */
function ed25519SecretKeyToX25519(secretKey: Uint8Array): Uint8Array {
  const hash = nacl.hash(secretKey.slice(0, 32));
  hash[0] &= 248;
  hash[31] &= 127;
  hash[31] |= 64;
  return hash.slice(0, 32);
}

/**
 * Convert Ed25519 public key to X25519
 * Note: This is a simplified version - in production use a proper library
 */
function ed25519PublicKeyToX25519(publicKey: Uint8Array): Uint8Array {
  // This is a placeholder - proper conversion requires more complex math
  // For MVP, we use a hash-based approach
  const hash = nacl.hash(publicKey);
  return hash.slice(0, 32);
}

/**
 * Sign a message with a keypair
 */
export function signMessage(message: Uint8Array, keypair: Keypair): Uint8Array {
  return nacl.sign.detached(message, keypair.secretKey);
}

/**
 * Verify a signature
 */
export function verifySignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return nacl.sign.detached.verify(message, signature, publicKey);
}

/**
 * Hash data using SHA-512
 */
export function hash(data: Uint8Array): Uint8Array {
  return nacl.hash(data);
}

/**
 * Generate a random nonce/salt
 */
export function randomBytes(length: number): Uint8Array {
  return nacl.randomBytes(length);
}

/**
 * Encode bytes to base58 string
 */
export function toBase58(data: Uint8Array): string {
  return bs58.encode(data);
}

/**
 * Decode base58 string to bytes
 */
export function fromBase58(str: string): Uint8Array {
  return bs58.decode(str);
}
