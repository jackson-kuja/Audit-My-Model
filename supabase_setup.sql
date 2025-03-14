-- Create audits table
CREATE TABLE public.audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  model_name TEXT NOT NULL,
  model_type TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'error')),
  score INTEGER,
  results JSONB,
  original_filename TEXT,
  file_size_bytes BIGINT,
  file_mime_type TEXT,
  upload_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS (Row Level Security) to restrict access
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only read their own audits
CREATE POLICY "Users can view their own audits" 
  ON public.audits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own audits
CREATE POLICY "Users can create their own audits" 
  ON public.audits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own audits
CREATE POLICY "Users can update their own audits" 
  ON public.audits
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  is_paid BOOLEAN DEFAULT false,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS to profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
