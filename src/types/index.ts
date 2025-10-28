export interface User {
  id: string;
  username: string;
  email?: string;
  wallet_address?: string;
  avatar_url: string;
  bio: string;
  subscription_price: number;
  social_links: Record<string, string>;
  created_at: string;
  usdc_balance: number;
  artx_balance: number;
  is_pilot: boolean;
}

export interface Post {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  content_type: 'video' | 'gallery' | 'article' | 'audio';
  ipfs_hash: string;
  access_type: 'public' | 'subscribers' | 'pay_per_view';
  price?: number;
  views_count: number;
  tips_received: number;
  published_at: string;
  blockchain_tx_hash: string;
}

export interface Subscription {
  id: string;
  creator_id: string;
  subscriber_wallet: string;
  subscriber_email?: string;
  nft_token_id?: number;
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
}

export interface Transaction {
  id: string;
  type: 'tip' | 'subscription' | 'purchase' | 'withdraw' | 'artx_reward';
  from_wallet: string;
  to_wallet: string;
  amount_usd: number;
  amount_crypto: number;
  crypto_currency: 'USDC' | 'ETH' | 'SOL' | 'ARTX';
  blockchain_tx_hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  reward_reason?: string;
}

export interface RewardNotification {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}
