-- Migration to add file-related columns to the audits table
ALTER TABLE public.audits
ADD COLUMN original_filename TEXT,
ADD COLUMN file_size_bytes BIGINT,
ADD COLUMN file_mime_type TEXT,
ADD COLUMN upload_timestamp TIMESTAMP WITH TIME ZONE; 