/*
  # Add $ARTX Token, USDC Balance and Pilot Mode

  1. Changes
    - Add `usdc_balance` column to users table (numeric, default 0)
    - Add `artx_balance` column to users table (numeric, default 0)
    - Add `is_pilot` column to users table (boolean, default false)
    - Create `artx_rewards` table for tracking reward history
    - Set initial balances for pilot users (1000 USDC, 500 ARTX)

  2. New Tables
    - `artx_rewards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `amount` (numeric)
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
    ALTER TABLE users ADD COLUMN usdc_balance numeric DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'artx_balance'
  ) THEN
    ALTER TABLE users ADD COLUMN artx_balance numeric DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_pilot'
  ) THEN
    ALTER TABLE users ADD COLUMN is_pilot boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Update existing users with default values
UPDATE users
SET
  usdc_balance = COALESCE(usdc_balance, 0),
  artx_balance = COALESCE(artx_balance, 0),
  is_pilot = COALESCE(is_pilot, true)
WHERE usdc_balance IS NULL OR artx_balance IS NULL OR is_pilot IS NULL;

-- Set initial balances for pilot users
UPDATE users
SET
  usdc_balance = 1000,
  artx_balance = 500
WHERE is_pilot = true;

-- Create artx_rewards table
CREATE TABLE IF NOT EXISTS artx_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
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
  USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_artx_rewards_user_id ON artx_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_artx_rewards_created_at ON artx_rewards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_pilot ON users(is_pilot);

-- Create trigger function for new pilot users
CREATE OR REPLACE FUNCTION set_pilot_initial_balances()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_pilot = true THEN
    NEW.usdc_balance := 1000;
    NEW.artx_balance := 500;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_pilot_balances ON users;
CREATE TRIGGER trigger_set_pilot_balances
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_pilot_initial_balances();
