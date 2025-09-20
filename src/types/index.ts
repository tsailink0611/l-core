import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  name?: string;
}

// Firestore Shop Document Schema
export interface Shop {
  name: string;
  plan: 'single';
  industry: string;
  createdAt: Timestamp;
  line: {
    accessToken: string;  // 暗号化済み
    channelSecret: string;  // 暗号化済み
  };
  config: {
    businessHours: string;
    targetAudience: string;
    ngWords: string[];
  };
}

export interface Proposal {
  type: '王道' | '挑戦' | '限定感';
  title: string;
  content: string;
  timing: string;
  reason: string;
}

// Firestore Campaign Subcollection Schema
export interface Campaign {
  title: string;
  type: '王道' | '挑戦' | '限定感';
  content: string;
  timing: string;
  reason: string;
  createdAt: Timestamp;
  sendAt: Timestamp | null;  // nullなら即時
  status: 'draft' | 'queued' | 'sending' | 'sent' | 'failed';
  lastAttemptAt: Timestamp | null;
  result?: {
    lineMessageId?: string;
    error?: string;
  };
}

// レガシー互換用（削除予定）
export interface ShopConfig {
  businessHours: string;
  targetAudience: string;
  ngWords: string[];
}

export interface ClaudeResponse {
  proposals: Proposal[];
}

// 暗号化システム用
export interface EncryptedData {
  iv: string;
  tag: string;
  encrypted: string;
}

// 時間管理用
export interface ScheduleOptions {
  timing: SendTiming;
  customDate?: Date;
}

// 配信タイミング選択肢
export type SendTiming = 'now' | 'in1hour' | 'tomorrow9am';

export const SEND_TIMING_OPTIONS = {
  now: { label: '今すぐ配信', value: 'now' as SendTiming },
  in1hour: { label: '1時間後', value: 'in1hour' as SendTiming },
  tomorrow9am: { label: '明日朝9時', value: 'tomorrow9am' as SendTiming }
} as const;

export const UI_TEXT = {
  BUTTON_SEND: "配信する",
  BUTTON_PREVIEW: "プレビュー",
  BUTTON_CREATE_NEW: "新しい配信を作成",
  BUTTON_LOGIN: "ログイン",
  BUTTON_GOOGLE_LOGIN: "Googleでログイン",
  TITLE_DASHBOARD: "ダッシュボード",
  TITLE_AI_PROPOSAL: "AI配信提案",
  PLACEHOLDER_REQUEST: "どのような配信をお考えですか？（例：週末集客したい）",
  TITLE_CAMPAIGNS: "配信履歴",
  LABEL_SEND_TIMING: "配信時間を選択",
  STATUS_DRAFT: "下書き",
  STATUS_QUEUED: "配信予約済み",
  STATUS_SENDING: "配信中",
  STATUS_SENT: "配信済み",
  STATUS_FAILED: "配信失敗"
} as const;