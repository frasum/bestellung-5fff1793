-- Move pg_net extension from public to extensions schema
-- First, drop the extension from public schema
DROP EXTENSION IF EXISTS pg_net;

-- Recreate it in the extensions schema (Supabase standard location)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;