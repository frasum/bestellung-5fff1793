-- Update the status check constraint to include 'cancelled'
ALTER TABLE invoice_processing_status 
DROP CONSTRAINT IF EXISTS invoice_processing_status_status_check;

ALTER TABLE invoice_processing_status 
ADD CONSTRAINT invoice_processing_status_status_check 
CHECK (status IN ('processing', 'completed', 'failed', 'cancelled'));