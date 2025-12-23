-- Assign existing Kokosmilch article to all YUM locations
INSERT INTO article_locations (article_id, location_id, is_active)
SELECT 
  '676eb92c-7177-4f7e-8ba4-969a62982b98' as article_id,
  l.id as location_id,
  true as is_active
FROM locations l
WHERE l.organization_id = '25ad4adc-d7c9-48cd-919a-4021c489f986'
ON CONFLICT DO NOTHING;