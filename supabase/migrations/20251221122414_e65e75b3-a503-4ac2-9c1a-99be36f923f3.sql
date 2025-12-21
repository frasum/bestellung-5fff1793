-- Add test_emails array column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS test_emails TEXT[] DEFAULT '{}';

-- Migrate existing test_email values to test_emails array
UPDATE organizations 
SET test_emails = ARRAY[test_email] 
WHERE test_email IS NOT NULL AND test_email != '' AND (test_emails IS NULL OR test_emails = '{}');