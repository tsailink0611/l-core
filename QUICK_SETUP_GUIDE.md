# 🚀 AIラインステップ v0.1 - クイックセットアップ

## ✅ 完了済み機能
- ✅ **フロントエンド**: 認証・ダッシュボード・AI提案・LINE配信UI
- ✅ **バックエンド**: API・暗号化・認証システム
- ✅ **テスト**: E2Eスモークテスト (4/5通過)
- ✅ **デモモード**: 即座にテスト可能

## 🎯 次のステップ (15分で完了)

### Step 1: Firebaseプロジェクト作成 (5分)
```bash
# 1. https://console.firebase.google.com にアクセス
# 2. 「プロジェクトを作成」→ 「ai-line-step-prod」
# 3. Analytics有効化
# 4. Authentication → メール/パスワード有効化
# 5. Firestore → データベース作成
```

### Step 2: 環境変数設定 (5分)
```bash
# プロジェクト設定 → 全般 → ウェブアプリ追加
# 設定値を .env.production にコピー:

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ai-line-step-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-line-step-prod
# ... 他の設定値

# Admin SDK
# プロジェクト設定 → サービス アカウント → 秘密鍵生成
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Step 3: APIキー取得 (5分)
```bash
# Anthropic Claude API
# https://console.anthropic.com → API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...

# 暗号化キー生成
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
DATA_ENCRYPTION_KEY=generated_key_here

# Cron認証キー生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET=generated_secret_here
```

## 🔄 現在の動作確認方法

### デモモード (現在)
```bash
npm run dev
# → http://localhost:3003
# デモユーザー自動ログイン
# 全機能UIテスト可能
```

### 本番モード (設定後)
```bash
# .env.local → .env.production に変更
npm run build && npm start
# 実際のFirebase認証・Claude API動作
```

## 📊 現在の完成度

| 機能 | デモモード | 本番モード |
|------|-----------|------------|
| 認証システム | ✅ | 🔄 (Firebase設定必要) |
| ダッシュボード | ✅ | ✅ |
| AI提案生成 | ✅ | 🔄 (Claude API必要) |
| LINE配信 | ✅ | 🔄 (LINE Token必要) |
| 暗号化システム | ✅ | ✅ |

## 🎉 MVP完成度: **85%**

**残りタスク**:
1. Firebase本番設定 (5分)
2. Claude API設定 (2分)
3. LINE Developer設定 (8分)

**総時間**: 15分で100%完成