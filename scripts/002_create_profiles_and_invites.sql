-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create profiles table for user roles and metadata
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" 
  ON profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create invites table to track sent invitations
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(email, status)
);

-- Enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Admins can manage invites
CREATE POLICY "Admins can manage invites" 
  ON invites FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (SELECT role FROM invites WHERE email = NEW.email AND status = 'pending' LIMIT 1),
      'member'
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Mark invite as accepted if exists
  UPDATE invites 
  SET status = 'accepted', accepted_at = NOW()
  WHERE email = NEW.email AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Insert initial admin profile for existing user
INSERT INTO profiles (id, email, role, full_name)
SELECT 
  id, 
  email, 
  'admin',
  COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users 
WHERE email = 'admin@pacificaisystems.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
