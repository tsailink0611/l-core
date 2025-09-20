# Firebase プロジェクト設定ガイド

## 1. Firebase プロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名: `ai-line-step-v0` または任意の名前
4. Google Analytics: 必要に応じて有効化

## 2. Authentication 設定

1. Firebase Console → Authentication
2. 「始める」をクリック
3. Sign-in method タブ
4. 有効にする認証方法:
   - メール/パスワード ✅
   - Google (推奨) ✅

## 3. Firestore Database 設定

1. Firebase Console → Firestore Database
2. 「データベースの作成」
3. セキュリティルール: **本番環境モード**で開始
4. ロケーション: `asia-northeast1` (東京)

## 4. Firebase Admin SDK 設定

1. Firebase Console → プロジェクト設定 → サービス アカウント
2. 「新しい秘密鍵の生成」をクリック
3. JSON ファイルをダウンロード
4. 環境変数設定:

```bash
# .env.local に追加
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

## 5. Web アプリ設定

1. Firebase Console → プロジェクト設定 → 全般
2. 「アプリを追加」→ Web アプリ
3. アプリ名: `ai-line-step-frontend`
4. Firebase SDK 設定をコピー:

```javascript
// フロントエンド用設定 (.env.local に追加)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 6. Firestore セキュリティルール

プロジェクトの `firestore.rules` を Firebase Console で設定:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 店舗コレクション - 認証済みユーザーが自分の店舗のみアクセス可能
    match /shops/{shopId} {
      allow read, write: if request.auth != null &&
        resource.data.ownerId == request.auth.uid;

      // 店舗内のキャンペーンコレクション
      match /campaigns/{campaignId} {
        allow read, write: if request.auth != null &&
          get(/databases/$(database)/documents/shops/$(shopId)).data.ownerId == request.auth.uid;
      }
    }
  }
}
```

## 7. 環境変数の最終確認

`.env.local` ファイルの完成形:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Firebase Web Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# その他の環境変数
DATA_ENCRYPTION_KEY=base64_encoded_32_byte_key
ANTHROPIC_API_KEY=sk-ant-xxxxx
CRON_SECRET=your-secure-random-string
```

## 8. デプロイ後の設定

1. Vercel環境変数設定
2. Firebase Hostingドメイン認証設定
3. Firestore データベースのインデックス作成

## トラブルシューティング

### PRIVATE_KEY エラー
- 改行文字が正しく設定されているか確認
- JSON内の `\n` を実際の改行に変換する必要がある場合あり

### 認証エラー
- プロジェクトIDが正確か確認
- サービスアカウントに適切な権限があるか確認

## 次のステップ

Firebase設定完了後、認証フロー実装に進みます:
1. フロントエンド Firebase 初期化
2. ログイン/ログアウト機能
3. 保護されたAPIルートのテスト