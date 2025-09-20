// Mock Database（MVP用）
export const mockShopData = {
  'demo-shop-1': {
    id: 'demo-shop-1',
    name: 'デモカフェ',
    industry: '飲食店',
    ownerId: 'demo-user-123',
    config: {
      businessHours: '10:00-22:00',
      maxCampaigns: 10,
      allowSmsMarketing: false,
    },
    line: {
      accessToken: 'demo-encrypted-access-token',
      channelSecret: 'demo-encrypted-channel-secret',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
};

export async function getShop(shopId: string) {
  const shop = mockShopData[shopId as keyof typeof mockShopData];
  if (!shop) {
    throw new Error('Shop not found');
  }
  return { exists: () => true, data: () => shop };
}