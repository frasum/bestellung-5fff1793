-- Drop wine catalog tokens table and related rate limits table
DROP TABLE IF EXISTS public.wine_token_rate_limits;
DROP TABLE IF EXISTS public.wine_catalog_tokens;

-- Drop the cleanup function for wine token rate limits
DROP FUNCTION IF EXISTS public.cleanup_wine_token_rate_limits();