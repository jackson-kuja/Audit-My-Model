-- Add file_path column to audits table
ALTER TABLE audits
ADD COLUMN file_path TEXT;

-- Enable Row Level Security on audits table if not already enabled
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Create policies for the audits table (instead of altering them)
CREATE POLICY "Users can view their own audits" 
ON audits FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own audits" 
ON audits FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own audits" 
ON audits FOR UPDATE
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own audits" 
ON audits FOR DELETE
USING (auth.uid()::text = user_id::text); 