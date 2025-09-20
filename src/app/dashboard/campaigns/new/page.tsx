'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { generateProposals } from '@/lib/claude';
import { broadcastLineMessage } from '@/lib/line';
import { validateLineMessage } from '@/lib/validation';
import { Shop, Proposal, ShopConfig, UI_TEXT } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';

// 動的インポートでパフォーマンス最適化
const ProposalCard = dynamic(() => import('@/components/ProposalCard'), {
  loading: () => <LoadingSpinner size="md" text="読み込み中..." />
});
const LinePreview = dynamic(() => import('@/components/LinePreview'), {
  loading: () => <LoadingSpinner size="sm" />
});

export default function NewCampaignPage() {
  const [user, setUser] = useState<any>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [request, setRequest] = useState('');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<'input' | 'select' | 'confirm'>('input');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const shopDoc = await getDoc(doc(db, 'shops', user.uid));
        if (shopDoc.exists()) {
          setShop(shopDoc.data() as Shop);
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // メモ化で再レンダリングを防止
  const shopConfig = useMemo((): ShopConfig => ({
    businessHours: '11:00-23:00',
    targetAudience: '30-50代ファミリー',
    ngWords: ['激安', '最安値', '格安']
  }), []);

  const handleGenerateProposals = useCallback(async () => {
    if (!request.trim() || !shop) return;

    // 入力検証
    const validation = validateLineMessage(request);
    if (!validation.isValid) {
      alert('入力内容に問題があります: ' + validation.errors.join(', '));
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateProposals(request, shop);
      setProposals(response.proposals);
      setStep('select');
    } catch (error) {
      console.error('Error generating proposals:', error);
      alert('提案の生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  }, [request, shop, shopConfig]);

  const handleSelectProposal = useCallback((proposal: Proposal) => {
    setSelectedProposal(proposal);
    setEditedMessage(proposal.content);
    setStep('confirm');
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!editedMessage.trim() || !shop?.line?.accessToken) {
      alert('LINEの設定が完了していません。');
      return;
    }

    // 最終検証
    const validation = validateLineMessage(editedMessage);
    if (!validation.isValid) {
      alert('配信内容に問題があります: ' + validation.errors.join(', '));
      return;
    }

    setIsSending(true);
    try {
      const success = await broadcastLineMessage(
        shop.line.accessToken,
        editedMessage
      );

      if (success) {
        alert('配信が完了しました！');
        router.push('/dashboard');
      } else {
        alert('配信に失敗しました。設定をご確認ください。');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('配信に失敗しました。');
    } finally {
      setIsSending(false);
    }
  }, [editedMessage, shop?.line?.accessToken, router]);

  if (!user || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                AI配信アシスタント
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Request Input */}
        {step === 'input' && (
          <div className="space-y-6">
            <div>
              <label htmlFor="request" className="block text-sm font-medium text-gray-700 mb-2">
                どのような配信をお考えですか？
              </label>
              <textarea
                id="request"
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder={UI_TEXT.PLACEHOLDER_REQUEST}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleGenerateProposals}
              disabled={!request.trim() || isGenerating}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-md"
            >
              {isGenerating ? 'AI提案を生成中...' : '提案を見る'}
            </button>
          </div>
        )}

        {/* Step 2: Proposal Selection with Inline Editing */}
        {step === 'select' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                AIからの提案（3パターン）- 編集して配信
              </h2>
              <div className="grid gap-6 md:grid-cols-1">
                {proposals.map((proposal, index) => (
                  <div
                    key={index}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedProposal?.type === proposal.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          proposal.type === '王道' ? 'bg-green-100 text-green-800' :
                          proposal.type === '挑戦' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {proposal.type}
                        </span>
                        <h3 className="font-semibold text-gray-900">{proposal.title}</h3>
                      </div>
                      <div className="text-sm text-gray-500">{proposal.timing}</div>
                    </div>

                    {selectedProposal?.type === proposal.type ? (
                      <div className="space-y-4">
                        <textarea
                          value={editedMessage}
                          onChange={(e) => setEditedMessage(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>文字数: {editedMessage.length}</span>
                          <span>効果: {proposal.reason}</span>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setSelectedProposal(null);
                              setEditedMessage('');
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            キャンセル
                          </button>
                          <button
                            onClick={() => setStep('confirm')}
                            disabled={!editedMessage.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md"
                          >
                            配信確認へ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-700 mb-2">{proposal.content}</p>
                        <p className="text-sm text-gray-500 mb-3">{proposal.reason}</p>
                        <button
                          onClick={() => {
                            setSelectedProposal(proposal);
                            setEditedMessage(proposal.content);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                        >
                          この提案を編集
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setStep('input')}
              className="text-blue-600 hover:text-blue-500"
            >
              ← 要望を変更する
            </button>
          </div>
        )}


        {/* Step 3: Final Confirmation */}
        {step === 'confirm' && selectedProposal && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                配信内容の最終確認
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="text-sm text-blue-700 mb-1">
                  選択した提案: <span className="font-medium">{selectedProposal.type}</span>
                </div>
                <div className="text-sm text-blue-600">
                  推奨配信時間: {selectedProposal.timing}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">配信メッセージ</h3>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="whitespace-pre-wrap text-gray-900">
                      {editedMessage}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    文字数: {editedMessage.length}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">プレビュー</h3>
                  <LinePreview message={editedMessage} />
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← 提案に戻る
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isSending}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md"
              >
                {isSending ? '配信中...' : UI_TEXT.BUTTON_SEND}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}