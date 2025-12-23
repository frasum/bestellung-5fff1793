-- Add developer_checklist_notes column to organizations table
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS developer_checklist_notes TEXT;