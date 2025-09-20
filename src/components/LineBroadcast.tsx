'use client';

import { useState } from 'react';
import { useLineBroadcast } from '@/hooks/useLineBroadcast';

interface LineBroadcastProps {
  shopId: string;
  shopName: string;
}

export default function LineBroadcast({ shopId, shopName }: LineBroadcastProps) {
  const [message, setMessage] = useState('');
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    messageId?: string;
    sentAt?: string;
    error?: string;
  } | null>(null);

  const { sendBroadcast, loading, error } = useLineBroadcast();

  const handleSend = async () => {
    if (!message.trim()) return;

    const result = await sendBroadcast(shopId, message);
    setLastResult(result);

    if (result.success) {
      setMessage(''); // 成功時はメッセージをクリア
    }
  };

  const messageLength = message.length;
  const maxLength = 5000;
  const isOverLimit = messageLength > maxLength;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          LINE即時配信 - {shopName}
        </h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="broadcast-message" className="block text-sm font-medium text-gray-700">
              配信メッセージ
            </label>
            <textarea
              id="broadcast-message"
              rows={6}
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                isOverLimit ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="LINE友だちに配信するメッセージを入力してください..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={maxLength + 100} // 少し余裕を持たせてフロントエンドでもチェック
            />
            <div className="mt-1 flex justify-between">
              <p className={`text-sm ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
                {messageLength}/{maxLength}文字
              </p>
              {isOverLimit && (
                <p className="text-sm text-red-600">
                  文字数制限を超えています
                </p>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">
                  配信前の確認事項
                </h4>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>メッセージ内容を再度確認してください</li>
                    <li>この配信は全ての友だちに送信されます</li>
                    <li>送信後の取り消しはできません</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={loading || !message.trim() || isOverLimit}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                配信中...
              </div>
            ) : (
              '今すぐ配信する'
            )}
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* 配信結果表示 */}
        {lastResult && (
          <div className={`mt-4 rounded-md p-4 ${
            lastResult.success ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className={`text-sm ${
              lastResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {lastResult.success ? (
                <div>
                  <p className="font-medium">配信が完了しました！</p>
                  {lastResult.messageId && (
                    <p className="mt-1">メッセージID: {lastResult.messageId}</p>
                  )}
                  {lastResult.sentAt && (
                    <p className="mt-1">送信時刻: {new Date(lastResult.sentAt).toLocaleString('ja-JP')}</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-medium">配信に失敗しました</p>
                  {lastResult.error && (
                    <p className="mt-1">エラー: {lastResult.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 配信履歴セクション（将来の拡張用） */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          最近の配信履歴
        </h4>
        <div className="text-center py-8 text-gray-500">
          <p>配信履歴機能は今後実装予定です</p>
        </div>
      </div>
    </div>
  );
}