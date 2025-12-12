-- Add email_preorder_received column to notification_preferences
ALTER TABLE notification_preferences
ADD COLUMN email_preorder_received BOOLEAN NOT NULL DEFAULT true;