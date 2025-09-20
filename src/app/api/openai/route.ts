import { NextRequest, NextResponse } from 'next/server';
import { generateProposalsWithOpenAI, generateMockOpenAIProposals } from '@/lib/openai';
import { assertAuth } from '@/lib/firebaseAdmin';
import { z } from 'zod';

// OpenAI GPT-5 Mini リクエストスキーマ
const OpenAIRequestSchema = z.object({
  prompt: z.string().min(1).max(1000),
  shopId: z.string().min(1),
  model: z.enum(['gpt-5-mini', 'gpt-5', 'gpt-4o-mini']).default('gpt-5-mini'),
  maxTokens: z.number().min(100).max(2000).optional().default(1000),
  temperature: z.number().min(0).max(2).optional().default(0.7),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // デモモード判定（Firebase Admin未設定時）
    const isDemo = !process.env.FIREBASE_PROJECT_ID ||
                   process.env.FIREBASE_PROJECT_ID === 'demo-project' ||
                   !process.env.OPENAI_API_KEY ||
                   process.env.OPENAI_API_KEY === 'demo-openai-key';

    // 認証確認（デモモード時はスキップ）
    let auth = { uid: 'demo-user-123', email: 'demo@example.com', verified: true };
    if (!isDemo) {
      auth = await assertAuth(request);
    }

    // リクエストボディ解析
    const body = await request.json();
    const validatedData = OpenAIRequestSchema.parse(body);

    const { prompt, shopId, model, maxTokens, temperature } = validatedData;

    let result;

    if (isDemo) {
      // デモモード: モック応答
      console.log('[INFO] OpenAI Demo mode - using mock responses');
      result = generateMockOpenAIProposals(prompt);
    } else {
      // 本番モード: 実際のGPT-5 Mini API呼び出し
      console.log(`[INFO] OpenAI ${model} API call initiated`, {
        shopId,
        promptLength: prompt.length,
        model,
        uid: auth.uid
      });

      result = await generateProposalsWithOpenAI(prompt, 'general', {
        model,
        maxTokens,
        temperature
      });
    }

    const duration = Date.now() - startTime;

    console.log(`[INFO] OpenAI ${model} response completed`, {
      shopId,
      proposalCount: result.proposals.length,
      duration: `${duration}ms`,
      model: result.model,
      tokens: result.usage
    });

    return NextResponse.json({
      success: true,
      proposals: result.proposals,
      metadata: {
        model: result.model,
        usage: result.usage,
        duration,
        isDemo,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error('[ERROR] OpenAI API route error', {
      error: error.message,
      stack: error.stack,
      ip: request.ip || request.headers.get('x-forwarded-for'),
      duration: `${duration}ms`
    });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    if (error.message.includes('authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message.includes('OpenAI')) {
      return NextResponse.json(
        { error: 'GPT-5 Mini API error occurred' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}