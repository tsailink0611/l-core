# L-CORE v1.0

Advanced LINE messaging automation for restaurants and small businesses.

## 機能

- Firebase認証（メール/パスワード + Google）
- GPT-5 Mini AI による3パターン配信提案
- LINE Messaging API連携
- 配信履歴管理
- スマホ完全対応

## セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
`.env.local.example` を `.env.local` にコピーして、各値を設定してください。

3. 開発サーバーの起動
```bash
npm run dev
```

## 必要なアカウント・設定

### Firebase
- Firebase プロジェクト作成
- Authentication 有効化（Email/Password + Google）
- Firestore データベース作成

### LINE Developers
- LINE Developers Console でチャネル作成
- Channel Access Token 取得
- Webhook URL 設定: `https://your-domain.vercel.app/api/line/webhook`

### OpenAI API
- OpenAI APIキー取得

## デプロイ

```bash
npm run build
vercel --prod
```

## 環境変数

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
OPENAI_API_KEY=
GOOGLE_DRIVE_API_KEY=
```

## ディレクトリ構造

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── campaigns/
│   │       └── new/page.tsx
│   └── api/
│       ├── openai/route.ts
│       └── line/webhook/route.ts
├── components/
│   ├── ProposalCard.tsx
│   └── LinePreview.tsx
├── lib/
│   ├── firebase.ts
│   ├── openai.ts
│   └── line.ts
└── types/
    └── index.ts
```

## 今後の予定（v1.1以降）

- 配信効果測定
- セグメント配信
- 画像付き配信
- 複数店舗管理
- クーポン機能
