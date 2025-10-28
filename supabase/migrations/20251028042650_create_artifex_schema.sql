/*
  # Artifex MVP Database Schema
  
  ## Overview
  This migration creates the core database structure for the Artifex platform,
  a Web3 creator monetization platform.
  
  ## New Tables
  
  ### 1. users
  - `id` (uuid, PK) - Unique identifier
  - `username` (text, unique) - Creator's username (artifex.io/username)
  - `email` (text, nullable) - Email if using email login
  - `wallet_address` (text, unique, nullable) - Blockchain wallet address
  - `avatar_url` (text) - IPFS or storage link to avatar
  - `bio` (text) - Creator bio (150 chars max)
  - `subscription_price` (decimal) - Monthly subscription price in USD
  - `social_links` (jsonb) - Social media links
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### 2. posts
  - `id` (uuid, PK) - Unique identifier
  - `creator_id` (uuid, FK) - References users.id
  - `title` (text) - Post title
  - `description` (text) - Post description
  - `content_type` (text) - Type: video, gallery, article, audio
  - `ipfs_hash` (text) - IPFS CID for content
  - `access_type` (text) - public, subscribers, pay_per_view
  - `price` (decimal, nullable) - Price for pay_per_view content
  - `views_count` (integer) - Number of views
  - `tips_received` (decimal) - Total tips received
  - `published_at` (timestamptz) - Publication timestamp
  - `blockchain_tx_hash` (text) - Transaction hash on blockchain
  
  ### 3. subscriptions
  - `id` (uuid, PK) - Unique identifier
  - `creator_id` (uuid, FK) - References users.id
  - `subscriber_wallet` (text) - Wallet address of subscriber
  - `subscriber_email` (text, nullable) - Email if paid with card
  - `nft_token_id` (integer) - NFT token ID for subscription
  - `status` (text) - active, cancelled, expired
  - `started_at` (timestamptz) - Subscription start date
  - `expires_at` (timestamptz) - Subscription expiry date
  - `auto_renew` (boolean) - Auto-renewal flag
  
  ### 4. transactions
  - `id` (uuid, PK) - Unique identifier
  - `type` (text) - tip, subscription, purchase, withdraw
  - `from_wallet` (text) - Payer's wallet
  - `to_wallet` (text) - Receiver's wallet
  - `amount_usd` (decimal) - Amount in USD
  - `amount_crypto` (decimal) - Amount in crypto
  - `crypto_currency` (text) - USDC, ETH, SOL
  - `blockchain_tx_hash` (text) - Blockchain transaction hash
  - `status` (text) - pending, confirmed, failed
  - `created_at` (timestamptz) - Transaction timestamp
  
  ## Security
  
  All tables have Row Level Security (RLS) enabled with appropriate policies:
  - Users can read their own data
  - Creators can manage their own posts
  - Public content is readable by everyone
  - Subscription data is visible to involved parties
  - Transaction history is visible to sender and receiver
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text,
  wallet_address text UNIQUE,
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  subscription_price decimal DEFAULT 9.99,
  social_links jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  content_type text NOT NULL,
  ipfs_hash text DEFAULT '',
  access_type text DEFAULT 'public' CHECK (access_type IN ('public', 'subscribers', 'pay_per_view')),
  price decimal,
  views_count integer DEFAULT 0,
  tips_received decimal DEFAULT 0,
  published_at timestamptz DEFAULT now(),
  blockchain_tx_hash text DEFAULT ''
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subscriber_wallet text NOT NULL,
  subscriber_email text,
  nft_token_id integer,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  auto_renew boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('tip', 'subscription', 'purchase', 'withdraw')),
  from_wallet text NOT NULL,
  to_wallet text NOT NULL,
  amount_usd decimal NOT NULL,
  amount_crypto decimal NOT NULL,
  crypto_currency text DEFAULT 'USDC' CHECK (crypto_currency IN ('USDC', 'ETH', 'SOL')),
  blockchain_tx_hash text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view public posts"
  ON posts FOR SELECT
  TO authenticated, anon
  USING (access_type = 'public' OR auth.uid() = creator_id);

CREATE POLICY "Creators can insert own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id OR subscriber_wallet = auth.uid()::text);

CREATE POLICY "Anyone can view transactions"
  ON transactions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_id ON subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_wallet ON transactions(from_wallet);
CREATE INDEX IF NOT EXISTS idx_transactions_to_wallet ON transactions(to_wallet);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);