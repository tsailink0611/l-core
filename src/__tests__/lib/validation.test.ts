import {
  ValidationError,
  validateEmail,
  validatePassword,
  escapeHtml,
  sanitizeInput,
  validateLineMessage,
  RateLimiter
} from '@/lib/validation';

describe('Validation Library', () => {
  describe('ValidationError', () => {
    it('カスタムエラークラスが正しく動作する', () => {
      const error = new ValidationError('Test error');
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test error');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('有効なメールアドレスを受け入れる', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email+tag@domain.co.jp')).toBe(true);
      expect(validateEmail('user123@test-domain.org')).toBe(true);
    });

    it('無効なメールアドレスを拒否する', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('有効なパスワードを受け入れる', () => {
      const result = validatePassword('securepassword123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('短すぎるパスワードを拒否する', () => {
      const result = validatePassword('12345');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードは6文字以上である必要があります');
    });

    it('長すぎるパスワードを拒否する', () => {
      const longPassword = 'a'.repeat(129);
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードは128文字以下である必要があります');
    });

    it('弱いパスワードを拒否する', () => {
      const result = validatePassword('password');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('より安全なパスワードを選択してください');
    });
  });

  describe('escapeHtml', () => {
    it('HTMLエスケープが正しく動作する', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml('Hello & "World"')).toBe('Hello &amp; &quot;World&quot;');
      expect(escapeHtml("It's a test")).toBe('It&#039;s a test');
    });
  });

  describe('sanitizeInput', () => {
    it('危険な文字を除去する', () => {
      expect(sanitizeInput('<script>alert("test")</script>')).toBe('scriptalert(test)/script');
      expect(sanitizeInput('  test input  ')).toBe('test input');
      expect(sanitizeInput('Hello & "World"')).toBe('Hello  World');
    });
  });

  describe('validateLineMessage', () => {
    it('有効なメッセージを受け入れる', () => {
      const result = validateLineMessage('こんにちは！今日は良い天気ですね。');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('空のメッセージを拒否する', () => {
      const result = validateLineMessage('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('メッセージが空です');
    });

    it('長すぎるメッセージを拒否する', () => {
      const longMessage = 'あ'.repeat(5001);
      const result = validateLineMessage(longMessage);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('メッセージは5000文字以下である必要があります');
    });

    it('NGワードを含むメッセージを拒否する', () => {
      const result = validateLineMessage('この商品は激安でお得です！');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('禁止されたワードが含まれています');
      expect(result.errors[0]).toContain('激安');
    });
  });

  describe('RateLimiter', () => {
    it('制限内のリクエストを許可する', () => {
      const limiter = new RateLimiter(5, 60000);
      
      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed('user1')).toBe(true);
      }
    });

    it('制限を超えたリクエストを拒否する', () => {
      const limiter = new RateLimiter(3, 60000);
      
      // 制限回数まで許可
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
      
      // 制限を超えたら拒否
      expect(limiter.isAllowed('user1')).toBe(false);
    });

    it('異なるユーザーは独立して制限される', () => {
      const limiter = new RateLimiter(2, 60000);
      
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user2')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user2')).toBe(true);
      
      // それぞれのユーザーが制限に達する
      expect(limiter.isAllowed('user1')).toBe(false);
      expect(limiter.isAllowed('user2')).toBe(false);
    });

    it('リセット機能が正しく動作する', () => {
      const limiter = new RateLimiter(1, 60000);
      
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(false);
      
      limiter.reset('user1');
      expect(limiter.isAllowed('user1')).toBe(true);
    });
  });
});