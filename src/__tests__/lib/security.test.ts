import {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  maskApiKey,
  generateCSRFToken,
  generateSecureRandomString,
  sanitizeLogData
} from '@/lib/security';

describe('Security Library', () => {
  describe('encrypt/decrypt', () => {
    it('データの暗号化と復号化が正しく動作する', () => {
      const originalText = 'This is a secret message';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
      expect(encrypted).not.toBe(originalText);
      expect(encrypted).toContain(':'); // IV:暗号化データの形式
    });

    it('異なる入力に対して異なる暗号化結果を生成する', () => {
      const text1 = 'message1';
      const text2 = 'message2';
      
      const encrypted1 = encrypt(text1);
      const encrypted2 = encrypt(text2);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('同じ入力でも毎回異なる暗号化結果を生成する（IVのため）', () => {
      const text = 'same message';
      
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(text);
      expect(decrypt(encrypted2)).toBe(text);
    });

    it('無効な暗号化データの復号化でエラーを投げる', () => {
      expect(() => decrypt('invalid-data')).toThrow();
      expect(() => decrypt('invalid:format:data')).toThrow();
    });
  });

  describe('hashPassword/verifyPassword', () => {
    it('パスワードのハッシュ化と検証が正しく動作する', async () => {
      const password = 'securePassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toContain(':'); // ソルト:ハッシュの形式
      expect(hash).not.toBe(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('間違ったパスワードで検証が失敗する', async () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('同じパスワードでも異なるハッシュを生成する', async () => {
      const password = 'samePassword';
      
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('maskApiKey', () => {
    it('APIキーを正しくマスクする', () => {
      const apiKey = 'sk-1234567890abcdef1234567890abcdef';
      const masked = maskApiKey(apiKey);
      
      expect(masked).toBe('sk-1************************cdef');
      expect(masked).not.toBe(apiKey);
    });

    it('短いキーに対して適切に処理する', () => {
      expect(maskApiKey('short')).toBe('***');
      expect(maskApiKey('')).toBe('***');
      expect(maskApiKey('12345678')).toBe('1234****5678');
    });
  });

  describe('generateCSRFToken', () => {
    it('CSRFトークンを生成する', () => {
      const token = generateCSRFToken();
      
      expect(token).toHaveLength(64); // 32バイト * 2（hex）
      expect(typeof token).toBe('string');
    });

    it('毎回異なるトークンを生成する', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateSecureRandomString', () => {
    it('指定された長さのランダム文字列を生成する', () => {
      const str = generateSecureRandomString(16);
      
      expect(str).toHaveLength(16);
      expect(typeof str).toBe('string');
    });

    it('デフォルトで32文字の文字列を生成する', () => {
      const str = generateSecureRandomString();
      
      expect(str).toHaveLength(32);
    });

    it('毎回異なる文字列を生成する', () => {
      const str1 = generateSecureRandomString(20);
      const str2 = generateSecureRandomString(20);
      
      expect(str1).not.toBe(str2);
    });
  });

  describe('sanitizeLogData', () => {
    it('機密データをログから除外する', () => {
      const data = {
        username: 'user123',
        password: 'secret123',
        token: 'abc123',
        publicInfo: 'visible data'
      };
      
      const sanitized = sanitizeLogData(data);
      
      expect(sanitized.username).toBe('user123');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.publicInfo).toBe('visible data');
    });

    it('ネストされたオブジェクトの機密データも処理する', () => {
      const data = {
        user: {
          name: 'John',
          password: 'secret'
        },
        apiKey: 'sensitive'
      };
      
      const sanitized = sanitizeLogData(data);
      
      expect(sanitized.user.name).toBe('John');
      expect(sanitized.user.password).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
    });

    it('文字列の機密データを処理する', () => {
      expect(sanitizeLogData('password: secret')).toBe('[REDACTED]');
      expect(sanitizeLogData('normal string')).toBe('normal string');
    });

    it('非オブジェクト型を適切に処理する', () => {
      expect(sanitizeLogData(123)).toBe(123);
      expect(sanitizeLogData(true)).toBe(true);
      expect(sanitizeLogData(null)).toBe(null);
    });
  });
});