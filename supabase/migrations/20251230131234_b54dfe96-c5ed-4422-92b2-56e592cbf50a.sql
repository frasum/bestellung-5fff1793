-- Change packaging_unit column from INTEGER to NUMERIC to support decimal values
ALTER TABLE articles 
ALTER COLUMN packaging_unit TYPE NUMERIC(10,2) 
USING packaging_unit::NUMERIC(10,2);