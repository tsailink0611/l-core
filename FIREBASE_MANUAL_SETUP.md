# 🔥 Firebase手動セットアップ - 5分完了ガイド

## 🎯 **目標：AIラインステップ v0.1 完全稼働**

### ✅ **前提条件**
- Googleアカウント: `tsailink0611@gmail.com`
- 目標プロジェクト名: `ai-line-step-prod`

---

## ⚡ **1. Firebase Console アクセス (1分)**

### URL直接アクセス
```
https://console.firebase.google.com
```

### ログイン手順
1. **通常のブラウザ**でURLにアクセス
2. **メールアドレス**: `tsailink0611@gmail.com`
3. **パスワード**入力
4. **2段階認証**（SMS/アプリ認証）

### ⚠️ **重要**: Puppeteer自動化不可のため手動必須

---

## 🏗️ **2. プロジェクト作成 (2分)**

### Step 1: 新規プロジェクト
```
「プロジェクトを作成」ボタンをクリック
```

### Step 2: プロジェクト設定
```
プロジェクト名: ai-line-step-prod
プロジェクトID: ai-line-step-prod（自動生成でOK）
```

### Step 3: Google Analytics
```
☑️ このプロジェクトでGoogle Analyticsを有効にする
Analytics アカウント: デフォルト
```

### Step 4: 作成完了
```
「プロジェクトを作成」→ 完了まで待機（30秒）
```

---

## 🔐 **3. Authentication設定 (1分)**

### 有効化手順
```
1. 左サイドバー「Authentication」
2. 「始める」ボタンをクリック
3. 「Sign-in method」タブ
4. 「Email/Password」を選択
5. 「有効にする」トグルをON
6. 「保存」をクリック
```

---

## 📊 **4. Firestore Database設定 (1分)**

### データベース作成
```
1. 左サイドバー「Firestore Database」
2. 「データベースを作成」
3. セキュリティルール: 「本番モードで開始」
4. ロケーション: asia-northeast1（東京）
5. 「完了」をクリック
```

---

## ⚙️ **5. Web App設定取得 (必須設定値)**

### Web アプリ追加
```
1. プロジェクト概要ページ
2. 「⚙️」歯車アイコン → 「プロジェクトの設定」
3. 「全般」タブ
4. 「アプリ」セクション → 「ウェブアプリを追加」
5. アプリのニックネーム: ai-line-step-web
6. ☑️ このアプリのFirebase Hostingも設定します
7. 「アプリを登録」
```

### 🔑 **重要：設定値をコピー**
以下の値をコピーして保存してください：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",              // ← これをコピー
  authDomain: "ai-line-step-prod.firebaseapp.com",
  projectId: "ai-line-step-prod",
  storageBucket: "ai-line-step-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 🛡️ **6. Admin SDK設定**

### サービスアカウント設定
```
1. プロジェクト設定 → 「サービス アカウント」タブ
2. 「新しい秘密鍵を生成」ボタン
3. JSONファイルがダウンロードされる
4. ファイルを安全な場所に保存
```

### 🔑 **重要：Private Key取得**
ダウンロードしたJSONファイルから：
```json
{
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

---

## 🎉 **7. 設定完了確認**

### ✅ **チェックリスト**
- [ ] Firebase プロジェクト作成完了
- [ ] Authentication (Email/Password) 有効化
- [ ] Firestore Database 作成完了
- [ ] Web App Firebase Config 取得
- [ ] Admin SDK Private Key 取得

### 📋 **次のステップ**
設定値を取得後、以下を実行：
```bash
# .env.production ファイルを更新
# システムを本番モードに切り替え
# LINE Developer設定に進行
```

---

## 🚀 **完了時間: 約5分**

このガイドに従えば、Firebase設定が完了し、AIラインステップ v0.1が本番環境で稼働開始します！

設定完了後、Firebase Config値をお知らせください。即座に環境変数を更新して本番モードに切り替えます！