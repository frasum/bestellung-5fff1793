-- Add sender_email column to communication_logs table
ALTER TABLE public.communication_logs 
ADD COLUMN sender_email TEXT;