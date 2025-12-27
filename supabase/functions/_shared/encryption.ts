// AES-256-GCM Encryption/Decryption helpers for Edge Functions

/**
 * Encrypts a password using AES-256-GCM
 * @param password - The plain text password to encrypt
 * @param key - Base64 encoded 32-byte encryption key
 * @returns Base64 encoded encrypted string (iv + ciphertext)
 */
export async function encryptPassword(password: string, key: string): Promise<string> {
  // Decode the base64 key
  const keyBuffer = Uint8Array.from(atob(key), c => c.charCodeAt(0));
  
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
 * @param key - Base64 encoded 32-byte encryption key
 * @returns The decrypted plain text password
 */
export async function decryptPassword(encrypted: string, key: string): Promise<string> {
  // Decode the base64 key
  const keyBuffer = Uint8Array.from(atob(key), c => c.charCodeAt(0));
  
  // Import the key for AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  
  // Decode the combined data
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  
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
