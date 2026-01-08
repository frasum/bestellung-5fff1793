-- Add location_id to inventory_sessions for location-specific inventory
ALTER TABLE inventory_sessions 
ADD COLUMN location_id UUID REFERENCES locations(id);

-- Assign existing sessions to the default location of their organization
UPDATE inventory_sessions 
SET location_id = (
  SELECT id FROM locations 
  WHERE organization_id = inventory_sessions.organization_id 
    AND is_default = true 
  LIMIT 1
)
WHERE location_id IS NULL;

-- Make location_id NOT NULL after migration
ALTER TABLE inventory_sessions 
ALTER COLUMN location_id SET NOT NULL;