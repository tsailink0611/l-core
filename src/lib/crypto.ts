// AES-GCM暗号化システム（v0.1仕様対応）
import crypto from "crypto";

const key = (() => {
  const keyString = process.env.DATA_ENCRYPTION_KEY;
  if (!keyString) {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.warn('DATA_ENCRYPTION_KEY not set, using dev key');
      // 正確に32バイトの固定キー（テスト用）
      return Buffer.alloc(32, 'dev-test-key');
    }
    throw new Error('DATA_ENCRYPTION_KEY environment variable is required');
  }
  return Buffer.from(keyString, 'base64');
})();

/**
 * AES-GCM暗号化
 * @param plaintext 平文文字列
 * @returns base64エンコードされた暗号化データ（iv+tag+encrypted）
 */
export function encrypt(plaintext: string): string {
  try {
    const iv = crypto.randomBytes(12); // GCMでは12バイト推奨
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const tag = cipher.getAuthTag(); // 16バイト認証タグ
    
    // iv(12) + tag(16) + encrypted を結合してbase64エンコード
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * AES-GCM復号化
 * @param ciphertext base64エンコードされた暗号化データ
 * @returns 復号化された平文文字列
 */
export function decrypt(ciphertext: string): string {
  try {
    const data = Buffer.from(ciphertext, 'base64');
    
    if (data.length < 28) { // iv(12) + tag(16) の最小サイズ
      throw new Error('Invalid ciphertext length');
    }
    
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const encrypted = data.subarray(28);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * LINEトークン安全保存用ヘルパー
 */
export function encryptLineCredentials(accessToken: string, channelSecret: string) {
  return {
    accessToken: encrypt(accessToken),
    channelSecret: encrypt(channelSecret)
  };
}

/**
 * LINEトークン復号化用ヘルパー
 */
export function decryptLineCredentials(encryptedAccessToken: string, encryptedChannelSecret: string) {
  return {
    accessToken: decrypt(encryptedAccessToken),
    channelSecret: decrypt(encryptedChannelSecret)
  };
}

/**
 * 暗号化キー強度チェック
 */
export function validateEncryptionKey(): boolean {
  try {
    if (!key || key.length !== 32) {
      return false;
    }
    
    // テスト暗号化で動作確認
    const testData = 'test_encryption_validation';
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    
    return decrypted === testData;
  } catch (error) {
    console.error('Encryption key validation failed:', error);
    return false;
  }
}

// 起動時にキー検証
if (process.env.NODE_ENV === 'production' && !validateEncryptionKey()) {
  throw new Error('Invalid encryption key configuration');
}