-- Add user_tier column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_tier VARCHAR(10) DEFAULT 'free';

-- Create batch_jobs table
CREATE TABLE IF NOT EXISTS batch_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id VARCHAR(100) NOT NULL,
  input_file_id VARCHAR(100) NOT NULL,
  output_file_id VARCHAR(100),
  error_file_id VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on batch_id
CREATE INDEX IF NOT EXISTS batch_jobs_batch_id_idx ON batch_jobs(batch_id);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS batch_jobs_user_id_idx ON batch_jobs(user_id);

-- Create index on output_file_id
CREATE INDEX IF NOT EXISTS batch_jobs_output_file_id_idx ON batch_jobs(output_file_id);

-- Update RLS policies for batch_jobs table
CREATE POLICY "Users can view their own batch jobs"
  ON batch_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own batch jobs"
  ON batch_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batch jobs"
  ON batch_jobs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on batch_jobs table
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY; 