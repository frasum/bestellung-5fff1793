-- Add source_article_id column to supplier_b2b_articles
ALTER TABLE supplier_b2b_articles 
ADD COLUMN source_article_id uuid REFERENCES articles(id) ON DELETE SET NULL;

-- Backfill existing articles by SKU matching
UPDATE supplier_b2b_articles b2b
SET source_article_id = (
  SELECT a.id FROM articles a 
  WHERE a.sku = b2b.sku 
  AND a.sku IS NOT NULL
  AND a.supplier_id = (
    SELECT linked_supplier_id FROM supplier_b2b_accounts 
    WHERE id = b2b.supplier_account_id
  )
  LIMIT 1
)
WHERE b2b.source_article_id IS NULL;