-- Add unit_price column to freeze article prices at inventory time
ALTER TABLE inventory_items 
ADD COLUMN unit_price numeric;

-- Add comment for documentation
COMMENT ON COLUMN inventory_items.unit_price IS 
  'Frozen article price at the time of inventory capture';