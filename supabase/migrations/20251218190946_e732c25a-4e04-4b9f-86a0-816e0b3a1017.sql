-- Erstelle einen permanenten Demo-Token für das Supplier Portal
INSERT INTO public.supplier_portal_tokens (
  supplier_id, 
  token, 
  expires_at
)
VALUES (
  '7426cdfc-9f66-4e8b-9fa7-8c9a01157e32',
  'DEMO_SUPPLIER_PORTAL_TOKEN_2025',
  '2099-12-31 23:59:59+00'
);