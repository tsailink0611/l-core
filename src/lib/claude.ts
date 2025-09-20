import Anthropic from '@anthropic-ai/sdk';
import { ClaudeResponse, Shop } from '@/types';
import { logger } from '@/lib/monitoring';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

function validateProposalsResponse(response: any): ValidationResult {
  const errors: string[] = [];

  if (!response || typeof response !== 'object') {
    errors.push('Response is not an object');
    return { isValid: false, errors };
  }

  if (!Array.isArray(response.proposals)) {
    errors.push('Proposals is not an array');
    return { isValid: false, errors };
  }

  if (response.proposals.length !== 3) {
    errors.push('Must have exactly 3 proposals');
  }

  const requiredTypes = ['王道', '挑戦', '限定感'];
  const foundTypes = new Set();

  response.proposals.forEach((proposal: any, index: number) => {
    if (!proposal || typeof proposal !== 'object') {
      errors.push(`Proposal ${index + 1} is not an object`);
      return;
    }

    const required = ['type', 'title', 'content', 'timing', 'reason'];
    required.forEach(field => {
      if (!proposal[field] || typeof proposal[field] !== 'string') {
        errors.push(`Proposal ${index + 1} missing or invalid ${field}`);
      }
    });

    if (proposal.type && !requiredTypes.includes(proposal.type)) {
      errors.push(`Proposal ${index + 1} has invalid type: ${proposal.type}`);
    }

    if (proposal.type) {
      foundTypes.add(proposal.type);
    }

    if (proposal.content && proposal.content.length > 200) {
      errors.push(`Proposal ${index + 1} content exceeds 200 characters`);
    }

    if (proposal.title && proposal.title.length > 15) {
      errors.push(`Proposal ${index + 1} title exceeds 15 characters`);
    }

    if (proposal.reason && proposal.reason.length > 50) {
      errors.push(`Proposal ${index + 1} reason exceeds 50 characters`);
    }
  });

  if (foundTypes.size !== 3) {
    errors.push('Must have one proposal of each type (王道, 挑戦, 限定感)');
  }

  return { isValid: errors.length === 0, errors };
}

function getIndustryGuidelines(industry: string): string {
  const guidelines = {
    '飲食店': '- 食欲をそそる表現を使用\n- 旬の食材や季節メニューを強調\n- 来店促進の工夫',
    '美容院・サロン': '- トレンドを意識した表現\n- 施術の効果や変化を強調\n- 予約促進の工夫',
    '小売店': '- 商品の魅力を具体的に表現\n- 在庫状況や入荷情報\n- 購買意欲を刺激する工夫',
    'エステ・リラクゼーション': '- リラックス効果を表現\n- 季節に応じたケア提案\n- 体験予約の促進',
    'フィットネス': '- 健康効果を強調\n- 運動習慣の継続サポート\n- 体験レッスンの案内',
    'default': '- 業界の特性を考慮した表現\n- 顧客のニーズに応じた提案\n- 来店・利用促進の工夫'
  };

  return guidelines[industry as keyof typeof guidelines] || guidelines.default;
}

function generateFallbackProposals(request: string, industry: string): ClaudeResponse {
  const baseProposals = {
    '飲食店': {
      王道: {
        title: 'おすすめメニュー',
        content: 'いつもご利用ありがとうございます🍽️ 本日のおすすめメニューをご用意いたしました。新鮮な食材を使った自慢の一品をぜひお試しください！',
        timing: '17:00',
        reason: 'ディナータイムに向けた訴求'
      },
      挑戦: {
        title: '限定コラボメニュー',
        content: '話題の新商品とのコラボメニューが登場✨ 今までにない味わいをお楽しみいただけます。数量限定につきお早めに！',
        timing: '12:00',
        reason: '話題性でランチ需要を喚起'
      },
      限定感: {
        title: '本日限定特価',
        content: '【本日のみ】人気メニューを特別価格でご提供🎉 この機会をお見逃しなく！ご来店お待ちしております。',
        timing: '10:30',
        reason: '早めの告知で一日の来店を促進'
      }
    },
    'default': {
      王道: {
        title: 'おすすめサービス',
        content: 'いつもご利用ありがとうございます😊 今月のおすすめサービスをご案内いたします。詳細はお気軽にお問い合わせください！',
        timing: '14:00',
        reason: '午後の時間帯に情報提供'
      },
      挑戦: {
        title: '新サービス開始',
        content: '新しいサービスがスタートしました✨ これまでにない体験をお客様にお届けします。ぜひお試しください！',
        timing: '11:00',
        reason: '午前中に新情報を発信'
      },
      限定感: {
        title: '期間限定キャンペーン',
        content: '【期間限定】特別キャンペーン実施中🎁 この機会をお見逃しなく！詳しくはお問い合わせください。',
        timing: '16:00',
        reason: '夕方の時間帯で締切感を演出'
      }
    }
  };

  const templates = baseProposals[industry as keyof typeof baseProposals] || baseProposals.default;

  return {
    proposals: [
      { type: '王道', ...templates.王道 },
      { type: '挑戦', ...templates.挑戦 },
      { type: '限定感', ...templates.限定感 }
    ]
  };
}

function generateMockProposals(request: string, industry: string): ClaudeResponse {
  logger.info('Generating mock proposals for development', { request, industry });

  const mockResponse = generateFallbackProposals(request, industry);

  // Add some variation for development testing
  mockResponse.proposals.forEach(proposal => {
    if (proposal.content.length < 150) {
      proposal.content += ` [開発モック: ${request}に関連した追加情報]`;
    }
  });

  return mockResponse;
}

export async function generateProposals(
  request: string,
  shop: Shop
): Promise<ClaudeResponse> {
  // 開発環境ではモックレスポンスを使用可能
  if (process.env.NODE_ENV === 'development' && process.env.USE_CLAUDE_MOCK === 'true') {
    logger.info('Using mock Claude response for development');
    return generateMockProposals(request, shop.industry);
  }
  const prompt = `
あなたは${shop.industry}専門のLINE配信アドバイザーです。

役割：
- 店舗の要望を聞いて、3つの配信案を提案
- 各案は異なるアプローチ（王道/挑戦/限定感）で差別化
- 簡潔で実践的な内容
- 日本の商習慣と時間帯を考慮

制約：
- 各提案は200文字以内
- 絵文字は適度に使用
- ${shop.config.ngWords.join(', ')}は絶対に使用禁止
- 配信時間は営業時間（${shop.config.businessHours}）内で最適化
- ターゲット：${shop.config.targetAudience}
- LINEマナーを遵守

業界特性：
${getIndustryGuidelines(shop.industry)}

要望：${request}

必須事項：
1. JSONフォーマットを厳守
2. 3パターンすべて異なるアプローチ
3. 実行可能で具体的な内容
4. 不適切な表現は一切使用しない

出力形式：
必ず以下のJSON形式で返答してください：
{
  "proposals": [
    {
      "type": "王道",
      "title": "タイトル（15文字以内）",
      "content": "本文（200文字以内）",
      "timing": "推奨配信時間（HH:MM形式）",
      "reason": "効果的な理由（50文字以内）"
    },
    {
      "type": "挑戦",
      "title": "タイトル（15文字以内）",
      "content": "本文（200文字以内）",
      "timing": "推奨配信時間（HH:MM形式）",
      "reason": "効果的な理由（50文字以内）"
    },
    {
      "type": "限定感",
      "title": "タイトル（15文字以内）",
      "content": "本文（200文字以内）",
      "timing": "推奨配信時間（HH:MM形式）",
      "reason": "効果的な理由（50文字以内）"
    }
  ]
}`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        const validation = validateProposalsResponse(parsedResponse);
        if (validation.isValid) {
          logger.info('Claude API response validated successfully');
          return parsedResponse;
        } else {
          logger.warn('Claude API response validation failed', { errors: validation.errors });
          return generateFallbackProposals(request, shop.industry);
        }
      }
    }
    logger.error('Invalid response format from Claude API');
    return generateFallbackProposals(request, shop.industry);
  } catch (error) {
    logger.error('Claude API Error', { error });
    return generateFallbackProposals(request, shop.industry);
  }
}