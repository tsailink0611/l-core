'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AIProposalGenerator from '@/components/AIProposalGenerator';
import OpenAIProposalGenerator from '@/components/OpenAIProposalGenerator';
import LineBroadcast from '@/components/LineBroadcast';
import { Proposal } from '@/lib/schemas';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [mockShop] = useState({
    id: 'demo-shop-1',
    name: 'デモカフェ',
    industry: '飲食店' as const,
    ownerId: user?.uid || '',
    config: {
      businessHours: '10:00-22:00',
      maxCampaigns: 10,
      allowSmsMarketing: false,
    },
    line: {
      accessToken: 'demo-token',
      channelSecret: 'demo-secret',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProposalSelect = (proposal: Proposal) => {
    console.log('Selected proposal:', proposal);
    // TODO: 選択された提案をキャンペーンとして保存
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold">L-CORE v1.0</h1>

              {/* タブナビゲーション */}
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  概要
                </button>
                <button
                  onClick={() => setActiveTab('ai-proposal')}
                  className={`${
                    activeTab === 'ai-proposal'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  🤖 AI提案
                </button>
                <button
                  onClick={() => setActiveTab('line-broadcast')}
                  className={`${
                    activeTab === 'line-broadcast'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  LINE配信
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'overview' && (
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  ダッシュボード
                </h2>
                <p className="text-gray-600 mb-8">
                  アドバンストメッセージングシステム
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                            <span className="text-white text-sm font-medium">🏪</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              店舗設定
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {mockShop.name}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                            <span className="text-white text-sm font-medium">📱</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              LINE連携
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              デモ用設定
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                            <span className="text-white text-sm font-medium">🤖</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              AI提案
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              利用可能
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-sm text-gray-500">
                    ユーザーID: {user.uid}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-proposal' && (
            <OpenAIProposalGenerator
              shop={mockShop}
              onProposalSelect={handleProposalSelect}
            />
          )}

          {activeTab === 'line-broadcast' && (
            <LineBroadcast
              shopId={mockShop.id}
              shopName={mockShop.name}
            />
          )}
        </div>
      </main>
    </div>
  );
}