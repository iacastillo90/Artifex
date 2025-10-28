/*
  # Add $ARTX Token and Pilot Mode

  1. Changes
    - Add `usdc_balance` column to users table (decimal, default 0)
    - Add `artx_balance` column to users table (decimal, default 0)
    - Add `is_pilot` column to users table (boolean, default false)
    - Create `artx_rewards` table for tracking reward history

  2. New Tables
    - `artx_rewards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `amount` (decimal)
      - `reason` (text)
      - `transaction_hash` (text, optional)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on artx_rewards table
    - Users can read their own reward history
*/

-- Add new columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'usdc_balance'
  ) THEN
    ALTER TABLE users ADD COLUMN usdc_balance decimal DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'artx_balance'
  ) THEN
    ALTER TABLE users ADD COLUMN artx_balance decimal DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_pilot'
  ) THEN
    ALTER TABLE users ADD COLUMN is_pilot boolean DEFAULT false;
  END IF;
END $$;

-- Create artx_rewards table
CREATE TABLE IF NOT EXISTS artx_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount decimal NOT NULL,
  reason text NOT NULL,
  transaction_hash text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE artx_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artx_rewards
CREATE POLICY "Users can read own rewards"
  ON artx_rewards FOR SELECT
  TO authenticated, anon
  USING (user_id::text = (SELECT id::text FROM users WHERE wallet_address = auth.uid()::text OR id = auth.uid()));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_artx_rewards_user_id ON artx_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_artx_rewards_created_at ON artx_rewards(created_at DESC);
