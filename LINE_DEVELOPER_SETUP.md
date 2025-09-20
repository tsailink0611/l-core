# LINE Developer ツール連携ガイド

## 🔰 LINE Developer アカウント作成

### Step 1: アカウント作成
1. [LINE Developers](https://developers.line.biz/ja/) にアクセス
2. 「ログイン」→ LINEアカウントでログイン
3. 開発者利用規約に同意

### Step 2: プロバイダー作成
1. Console → 「プロバイダー作成」
2. プロバイダー名: `AIラインステップ` または任意
3. 作成完了

## 🤖 Messaging API チャンネル作成

### Step 3: チャンネル作成
1. プロバイダー → 「Messaging APIチャンネル作成」
2. 基本情報入力:
   ```
   チャンネル名: AIラインステップBot
   チャンネル説明: 店舗向けLINE自動配信システム
   大業種: サービス
   小業種: その他のサービス
   メールアドレス: your-email@example.com
   ```

### Step 4: 重要設定
```
✅ Webhook URL: https://your-app.vercel.app/api/line/webhook/demo-shop-1
✅ Webhookの利用: 有効
✅ 応答メッセージ: 無効（自動応答を防止）
✅ あいさつメッセージ: 有効
```

## 🔑 認証情報取得

### Step 5: トークン取得
1. **チャンネルアクセストークン**
   - チャンネル基本設定 → チャンネルアクセストークン
   - 「発行」ボタンをクリック
   - `LINE_CHANNEL_ACCESS_TOKEN` としてコピー

2. **チャンネルシークレット**
   - チャンネル基本設定 → チャンネルシークレット
   - `LINE_CHANNEL_SECRET` としてコピー

## 🎯 LINE公式アカウント設定

### Step 6: 公式アカウント設定
1. LINE Official Account Manager にアクセス
2. 基本設定:
   ```
   アカウント名: AIラインステップDemo
   ステータスメッセージ: AI powered marketing automation
   プロフィール画像: ロゴ画像をアップロード
   ```

3. 応答設定:
   ```
   ✅ 応答メッセージ: オフ
   ✅ あいさつメッセージ: オン
   ✅ Webhook: オン
   ```

## 🧪 テスト手順

### Step 7: 動作確認
1. **友だち追加**
   - QRコードを読み取り
   - テストアカウントで友だち追加

2. **Webhook テスト**
   ```bash
   # 手動メッセージ送信テスト
   curl -X POST https://your-app.vercel.app/api/line/broadcast \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer demo-token-123" \
     -d '{
       "shopId": "demo-shop-1",
       "message": {
         "type": "text",
         "text": "テストメッセージです！"
       }
     }'
   ```

3. **自動応答テスト**
   - 「営業時間」と送信
   - 「メニュー」と送信
   - 自動応答が返ってくることを確認

## 📊 本番運用設定

### Step 8: 本番モード移行
```
1. 開発モード → 本番モード切り替え
2. 利用規約・プライバシーポリシー設定
3. 認証済みアカウント申請（必要に応じて）
4. 友だち数・メッセージ数の制限確認
```

### メッセージ配信制限
- **フリープラン**: 1,000通/月
- **ライトプラン**: 15,000通/月 (5,000円)
- **スタンダードプラン**: 45,000通/月 (15,000円)

## 🔐 セキュリティ設定

### Webhook 署名検証
```javascript
// 自動実装済み: src/app/api/line/webhook/[shopId]/route.ts
const signature = request.headers.get('x-line-signature');
const hash = crypto.createHmac('sha256', channelSecret)
  .update(body)
  .digest('base64');
```

### IP許可リスト（推奨）
```
LINE Platform IP ranges:
- 147.92.150.192/26
- 147.92.150.128/26
```

## 🚀 デプロイ後の設定

### Webhook URL 更新
```
開発環境: http://localhost:3002/api/line/webhook/demo-shop-1
本番環境: https://your-app.vercel.app/api/line/webhook/demo-shop-1
```

## 🆘 トラブルシューティング

### よくある問題
1. **Webhook応答エラー**
   - ステータスコード200を返却しているか確認
   - レスポンス時間が5秒以内か確認

2. **メッセージ送信失敗**
   - チャンネルアクセストークンの有効性確認
   - 友だち登録状況確認

3. **暗号化エラー**
   - チャンネルシークレットの暗号化状況確認
   - 環境変数設定確認

---

**完了チェックリスト:**
- □ LINE Developers アカウント作成
- □ Messaging API チャンネル作成
- □ Webhook URL 設定
- □ チャンネルアクセストークン取得
- □ チャンネルシークレット取得
- □ 環境変数設定
- □ 友だち追加テスト
- □ メッセージ送信テスト
- □ 自動応答テスト