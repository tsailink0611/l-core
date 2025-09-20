import { z } from 'zod';

export const ShopConfigSchema = z.object({
  businessHours: z.string().min(1, '営業時間は必須です'),
  maxCampaigns: z.number().min(1).max(100).default(10),
  allowSmsMarketing: z.boolean().default(false),
  webhookUrl: z.string().url().optional(),
});

export const ShopSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, '店舗名は必須です').max(100),
  industry: z.enum(['飲食店', '美容院・サロン', 'エステ・リラクゼーション', 'その他']),
  ownerId: z.string().min(1),
  config: ShopConfigSchema,
  line: z.object({
    accessToken: z.string().min(1, 'LINEアクセストークンは必須です'),
    channelSecret: z.string().min(1, 'LINEチャンネルシークレットは必須です'),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ClaudeRequestSchema = z.object({
  request: z.string()
    .min(1, 'リクエスト内容は必須です')
    .max(1000, 'リクエスト内容は1000文字以内で入力してください')
    .regex(/^[^<>{}]*$/, '不正な文字が含まれています'),
  shop: ShopSchema,
});

export const ProposalSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
  reasoning: z.string().min(1).max(500),
  tags: z.array(z.string()).max(5),
  confidence: z.number().min(0).max(1),
});

export const ClaudeResponseSchema = z.object({
  proposals: z.array(ProposalSchema).min(1).max(3),
  analysisTime: z.number().positive(),
  industryInsights: z.string().optional(),
});

export const CampaignSchema = z.object({
  id: z.string().min(1),
  shopId: z.string().min(1),
  title: z.string().min(1, 'タイトルは必須です').max(100),
  content: z.string().min(1, 'コンテンツは必須です').max(1000),
  status: z.enum(['draft', 'queued', 'sending', 'sent', 'failed']),
  sendAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  result: z.object({
    lineMessageId: z.string().optional(),
    error: z.string().optional(),
    sentAt: z.date().optional(),
  }).optional(),
});

export const LineMessageSchema = z.object({
  type: z.literal('text'),
  text: z.string()
    .min(1, 'メッセージ内容は必須です')
    .max(5000, 'メッセージは5000文字以内で入力してください')
    .regex(/^[^<>{}]*$/, '不正な文字が含まれています'),
});

export const LineWebhookEventSchema = z.object({
  type: z.enum(['message', 'follow', 'unfollow', 'postback']),
  source: z.object({
    type: z.enum(['user', 'group', 'room']),
    userId: z.string().optional(),
    groupId: z.string().optional(),
    roomId: z.string().optional(),
  }),
  timestamp: z.number(),
  message: LineMessageSchema.optional(),
});

export const LineWebhookSchema = z.object({
  destination: z.string(),
  events: z.array(LineWebhookEventSchema),
});

export type Shop = z.infer<typeof ShopSchema>;
export type ShopConfig = z.infer<typeof ShopConfigSchema>;
export type ClaudeRequest = z.infer<typeof ClaudeRequestSchema>;
export type ClaudeResponse = z.infer<typeof ClaudeResponseSchema>;
export type Proposal = z.infer<typeof ProposalSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type LineMessage = z.infer<typeof LineMessageSchema>;
export type LineWebhookEvent = z.infer<typeof LineWebhookEventSchema>;
export type LineWebhook = z.infer<typeof LineWebhookSchema>;

export function validateAndParse<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      success: false,
      errors: ['バリデーションエラーが発生しました']
    };
  }
}