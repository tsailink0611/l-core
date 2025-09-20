import OpenAI from 'openai';

// OpenAI GPT-5 Mini クライアント (2025年最新モデル)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID || undefined,
});

export interface OpenAIConfig {
  model: 'gpt-5-mini' | 'gpt-5' | 'gpt-4o-mini';
  maxTokens?: number;
  temperature?: number;
}

export async function generateProposalsWithOpenAI(
  prompt: string,
  shopType: string = 'general',
  config: OpenAIConfig = { model: 'gpt-5-mini' }
) {
  try {
    const systemPrompt = `あなたは日本の店舗向けマーケティング専門家です。

店舗タイプ: ${shopType}
以下の要求に対して、LINEメッセージ配信に適した3つの具体的な提案を日本語で生成してください。

各提案は以下の形式で：
- タイトル（20文字以内）
- メッセージ内容（100文字程度）
- 配信タイミング
- 期待効果

実用的で魅力的な提案を作成してください。`;

    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI API returned no content');
    }

    // 提案をパース（簡易実装）
    const proposals = parseProposals(content);

    return {
      proposals,
      usage: response.usage,
      model: config.model,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('GPT-5 Mini提案生成に失敗しました');
  }
}

function parseProposals(content: string) {
  // GPT-5 Miniの出力をパースして構造化
  const sections = content.split(/提案[１-３1-3]|##/).filter(s => s.trim());

  return sections.slice(1, 4).map((section, index) => ({
    id: `gpt5-proposal-${index + 1}`,
    title: extractTitle(section),
    message: extractMessage(section),
    timing: extractTiming(section),
    expectedEffect: extractEffect(section),
    confidence: 0.9, // GPT-5 Miniは高精度
  }));
}

function extractTitle(section: string): string {
  const titleMatch = section.match(/タイトル[：:]\s*(.+?)(\n|$)/);
  return titleMatch?.[1]?.trim() || '提案タイトル';
}

function extractMessage(section: string): string {
  const messageMatch = section.match(/メッセージ[：:]?\s*(.+?)(?=\n.*?配信|$)/s);
  return messageMatch?.[1]?.trim() || 'メッセージ内容';
}

function extractTiming(section: string): string {
  const timingMatch = section.match(/配信タイミング[：:]\s*(.+?)(\n|$)/);
  return timingMatch?.[1]?.trim() || '適切なタイミング';
}

function extractEffect(section: string): string {
  const effectMatch = section.match(/期待効果[：:]\s*(.+?)(\n|$)/);
  return effectMatch?.[1]?.trim() || '顧客満足度向上';
}

// デモ環境用のモック応答
export function generateMockOpenAIProposals(prompt: string) {
  return {
    proposals: [
      {
        id: 'gpt5-demo-1',
        title: 'GPT-5 Mini春キャンペーン',
        message: `🌸 春限定メニューが登場！\n新鮮な春野菜を使った特別料理をお楽しみください。\n今だけ20%OFF！`,
        timing: '春の開始時期（3月初旬）',
        expectedEffect: '季節感で顧客の関心を引き、売上向上',
        confidence: 0.95,
      },
      {
        id: 'gpt5-demo-2',
        title: 'GPT-5 Mini友達紹介特典',
        message: `👥 お友達紹介キャンペーン実施中！\nご紹介いただくと、お二人とも500円割引🎁\n期間限定なのでお早めに！`,
        timing: '月末・月初（新規顧客獲得時期）',
        expectedEffect: '口コミ効果で新規顧客獲得、リピート率向上',
        confidence: 0.92,
      },
      {
        id: 'gpt5-demo-3',
        title: 'GPT-5 Mini誕生日特典',
        message: `🎂 お誕生日おめでとうございます！\n特別な日に心を込めたサプライズをご用意🎁\nお誕生日ケーキプレゼント中！`,
        timing: '顧客の誕生日当日・前日',
        expectedEffect: '特別感演出で顧客ロイヤリティ向上',
        confidence: 0.94,
      }
    ],
    usage: { prompt_tokens: 150, completion_tokens: 300, total_tokens: 450 },
    model: 'gpt-5-mini' as const,
  };
}