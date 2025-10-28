/*
  # Fix User Creation Policies
  
  ## Changes
  - Allow anonymous users to create their own user profiles
  - Allow anonymous users to insert posts during onboarding
  
  This enables the onboarding flow to work without authentication.
*/

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can create user profile" ON users;
DROP POLICY IF EXISTS "Creators can insert own posts" ON posts;

CREATE POLICY "Anyone can create user profile"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Creators can insert posts"
  ON posts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);