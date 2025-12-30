-- Mark old hanging invoice processing as failed
UPDATE invoice_processing_status
SET status = 'failed',
    completed_at = NOW(),
    error_message = 'Process timed out or was interrupted'
WHERE status = 'processing'
AND created_at < NOW() - INTERVAL '10 minutes';