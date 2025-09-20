// 入力検証ライブラリ
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// メールアドレス検証
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// パスワード強度検証
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('パスワードは6文字以上である必要があります');
  }
  
  if (password.length > 128) {
    errors.push('パスワードは128文字以下である必要があります');
  }
  
  // 一般的な弱いパスワードをチェック
  const weakPasswords = ['123456', 'password', '123456789', 'qwerty'];
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('より安全なパスワードを選択してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// HTMLエスケープ（XSS対策）
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// SQLインジェクション対策用のサニタイズ
export function sanitizeInput(input: string): string {
  // 危険な文字を除去
  return input.replace(/[<>&"']/g, '').trim();
}

// LINE配信メッセージの検証
export function validateLineMessage(message: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!message || message.trim().length === 0) {
    errors.push('メッセージが空です');
  }
  
  if (message.length > 5000) {
    errors.push('メッセージは5000文字以下である必要があります');
  }
  
  // NGワードチェック（実際の実装では外部設定から取得）
  const ngWords = ['激安', '最安値', '格安'];
  const foundNgWords = ngWords.filter(word => message.includes(word));
  if (foundNgWords.length > 0) {
    errors.push(`禁止されたワードが含まれています: ${foundNgWords.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// レート制限チェック
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1分
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // 期間外のリクエストを削除
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
  
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}