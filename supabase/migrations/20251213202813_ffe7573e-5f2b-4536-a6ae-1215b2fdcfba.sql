-- Fix Realtime for cart_drafts by setting REPLICA IDENTITY to FULL
ALTER TABLE cart_drafts REPLICA IDENTITY FULL;