// AES-256-GCM Encryption/Decryption helpers for Edge Functions

/**
 * Converts a key string to a 32-byte ArrayBuffer for AES-256
 * Handles both base64 keys and raw string keys
 */
function getKeyBuffer(key: string): ArrayBuffer {
  // First, try to detect if it's base64 by checking for valid base64 characters
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(key) && key.length >= 24;
  
  if (isBase64) {
    try {
      const decoded = atob(key);
      if (decoded.length >= 16) {
        // Valid base64 key - use it
        const buffer = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          buffer[i] = decoded.charCodeAt(i);
        }
        // Ensure exactly 32 bytes for AES-256
        if (buffer.length >= 32) {
          return buffer.slice(0, 32).buffer as ArrayBuffer;
        }
        // Pad if shorter
        const padded = new Uint8Array(32);
        padded.set(buffer);
        return padded.buffer as ArrayBuffer;
      }
    } catch {
      // Not valid base64, fall through to raw handling
    }
  }
  
  // Treat as raw string key - derive 32 bytes from it
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  
  // Simple key derivation: use first 32 bytes or pad with repeated key
  const buffer = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    buffer[i] = keyBytes[i % keyBytes.length];
  }
  return buffer.buffer as ArrayBuffer;
}

/**
 * Encrypts a password using AES-256-GCM
 * @param password - The plain text password to encrypt
 * @param key - Encryption key (base64 encoded or raw string)
 * @returns Base64 encoded encrypted string (iv + ciphertext)
 */
export async function encryptPassword(password: string, key: string): Promise<string> {
  // Get a proper 32-byte key buffer
  const keyBuffer = getKeyBuffer(key);
  
  // Import the key for AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  // Generate a random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encode the password to bytes
  const encoded = new TextEncoder().encode(password);
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encoded
  );
  
  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts an encrypted password using AES-256-GCM
 * @param encrypted - Base64 encoded encrypted string (iv + ciphertext)
 * @param key - Encryption key (base64 encoded or raw string)
 * @returns The decrypted plain text password
 */
export async function decryptPassword(encrypted: string, key: string): Promise<string> {
  // Get a proper 32-byte key buffer
  const keyBuffer = getKeyBuffer(key);
  
  // Import the key for AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  
  // Decode the combined data
  const decoded = atob(encrypted);
  const combined = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    combined[i] = decoded.charCodeAt(i);
  }
  
  // Extract IV (first 12 bytes) and ciphertext (rest)
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertext
  );
  
  // Return as string
  return new TextDecoder().decode(decrypted);
}
