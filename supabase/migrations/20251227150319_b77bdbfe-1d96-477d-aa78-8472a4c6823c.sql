-- Add analysis tracking fields to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS analysis_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS analysis_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS analysis_error TEXT;

-- Update status constraint to include all existing + new statuses
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'cancelled', 'discrepancy', 'matched'));