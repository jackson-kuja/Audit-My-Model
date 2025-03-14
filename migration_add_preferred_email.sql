-- Migration to add preferred_email column to profiles table
ALTER TABLE public.profiles
ADD COLUMN preferred_email TEXT; 