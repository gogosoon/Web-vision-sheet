/**
 * Token storage service for Electron main process
 * Provides secure, persistent storage for authentication tokens
 */
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Constants for token storage
const TOKEN_STORE_FILE = 'auth_token.dat';
const ENCRYPTION_KEY_FILE = 'encryption_key.dat';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

export class TokenStorage {
  private storePath: string;
  private keyPath: string;
  private encryptionKey: Buffer | null = null;

  constructor() {
    // Use userData directory for persistent storage
    const userDataPath = app.getPath('userData');
    this.storePath = path.join(userDataPath, TOKEN_STORE_FILE);
    this.keyPath = path.join(userDataPath, ENCRYPTION_KEY_FILE);
  }

  /**
   * Initialize the encryption key (create if doesn't exist)
   */
  private async ensureEncryptionKey(): Promise<Buffer> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    try {
      // Try to read existing key
      this.encryptionKey = await fs.readFile(this.keyPath);
    } catch (error) {
      // Generate new key if doesn't exist
      this.encryptionKey = crypto.randomBytes(32); // 256 bits
      await fs.writeFile(this.keyPath, this.encryptionKey);
      console.log('Created new encryption key for token storage');
    }

    return this.encryptionKey;
  }

  /**
   * Save token securely
   */
  async saveToken(token: string): Promise<void> {
    try {
      const key = await this.ensureEncryptionKey();
      const iv = crypto.randomBytes(16);
      
      // Encrypt the token
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Store IV + encrypted token
      const data = JSON.stringify({
        iv: iv.toString('hex'),
        token: encrypted
      });
      
      await fs.writeFile(this.storePath, data);
      console.log('Token saved securely to storage');
    } catch (error) {
      console.error('Error saving token:', error);
      throw new Error('Failed to save authentication token');
    }
  }

  /**
   * Get token from secure storage
   */
  async getToken(): Promise<string | null> {
    try {
      // Check if token file exists
      try {
        await fs.access(this.storePath);
      } catch {
        console.log('No token found in storage');
        return null;
      }

      const key = await this.ensureEncryptionKey();
      const data = JSON.parse(await fs.readFile(this.storePath, 'utf8'));
      
      // Decrypt the token
      const iv = Buffer.from(data.iv, 'hex');
      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
      let decrypted = decipher.update(data.token, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  /**
   * Delete stored token (for logout)
   */
  async clearToken(): Promise<void> {
    try {
      await fs.unlink(this.storePath).catch(() => {
        // Ignore error if file doesn't exist
      });
      console.log('Token cleared from storage');
    } catch (error) {
      console.error('Error clearing token:', error);
      throw new Error('Failed to clear authentication token');
    }
  }
}

// Export a singleton instance
export const tokenStorage = new TokenStorage(); 