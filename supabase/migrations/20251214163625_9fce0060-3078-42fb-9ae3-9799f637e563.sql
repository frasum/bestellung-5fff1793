-- Add wine_catalog_access column to employees table
ALTER TABLE public.employees 
ADD COLUMN wine_catalog_access TEXT DEFAULT 'none';

-- Add comment for documentation
COMMENT ON COLUMN public.employees.wine_catalog_access IS 'Wine catalog access level: none, view, or edit';