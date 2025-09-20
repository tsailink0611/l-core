import crypto from 'crypto';

// 暗号化キー（実際は環境変数から取得）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-32-characters!!';
const ALGORITHM = 'aes-256-gcm';

// データ暗号化
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('暗号化エラー:', error);
    throw new Error('データの暗号化に失敗しました');
  }
}

// データ復号化
export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('無効な暗号化データ形式');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('復号化エラー:', error);
    throw new Error('データの復号化に失敗しました');
  }
}

// パスワードハッシュ化
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
    });
  });
}

// パスワード検証
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, Buffer.from(salt, 'hex'), 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

// APIキーマスキング
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '***';
  return apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
}

// CSRFトークン生成
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// セキュアなランダム文字列生成
export function generateSecureRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = crypto.randomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
}

// IPアドレス取得（プロキシ対応）
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// 機密データログ除外
export function sanitizeLogData(data: any): any {
  const sensitive = ['password', 'token', 'secret', 'key', 'auth'];
  
  if (typeof data === 'string') {
    return sensitive.some(s => data.toLowerCase().includes(s)) ? '[REDACTED]' : data;
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const key in data) {
      const isSensitive = sensitive.some(s => key.toLowerCase().includes(s));
      sanitized[key] = isSensitive ? '[REDACTED]' : sanitizeLogData(data[key]);
    }
    return sanitized;
  }
  
  return data;
}