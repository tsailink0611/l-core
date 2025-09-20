// AES-GCM暗号化システム実機テスト
import { encrypt, decrypt, validateEncryptionKey, encryptLineCredentials, decryptLineCredentials } from '../crypto';

describe('Crypto - AES-GCM実機テスト', () => {
  beforeAll(() => {
    // テスト用の32バイト暗号化キーを設定
    process.env.DATA_ENCRYPTION_KEY = Buffer.from('test-key-32-bytes-for-testing!!').toString('base64');
  });

  afterAll(() => {
    delete process.env.DATA_ENCRYPTION_KEY;
  });

  test('暗号化キー検証', () => {
    expect(validateEncryptionKey()).toBe(true);
  });

  test('基本的な暗号化・復号化', () => {
    const plaintext = 'Hello, World! 日本語テスト 🔐';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    
    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.length).toBeGreaterThan(0);
  });

  test('LINEトークン暗号化・復号化', () => {
    const accessToken = 'test-line-access-token-12345';
    const channelSecret = 'test-channel-secret-67890';
    
    const encrypted = encryptLineCredentials(accessToken, channelSecret);
    const decrypted = decryptLineCredentials(encrypted.accessToken, encrypted.channelSecret);
    
    expect(decrypted.accessToken).toBe(accessToken);
    expect(decrypted.channelSecret).toBe(channelSecret);
  });

  test('空文字列の暗号化', () => {
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe('');
  });

  test('無効な暗号化データでエラー', () => {
    expect(() => decrypt('invalid-base64')).toThrow();
    expect(() => decrypt('')).toThrow();
    expect(() => decrypt('dGVzdA==')).toThrow(); // 短すぎるデータ
  });

  test('暗号化の一意性', () => {
    const plaintext = 'Same input text';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    
    // 同じ入力でも異なる暗号化結果（IVがランダム）
    expect(encrypted1).not.toBe(encrypted2);
    
    // どちらも正しく復号化
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });
});