-- Bestehende Sequence löschen falls vorhanden
DROP SEQUENCE IF EXISTS public.order_number_seq;

-- Neue Sequence erstellen mit aktuellem Höchstwert
DO $$
DECLARE
  max_seq INTEGER;
BEGIN
  -- Höchste existierende Sequenznummer ermitteln
  SELECT COALESCE(
    MAX(
      CAST(
        REGEXP_REPLACE(order_number, '^.*-(\d+)$', '\1') 
        AS INTEGER
      )
    ), 
    0
  ) INTO max_seq 
  FROM public.orders 
  WHERE order_number ~ '-\d{4}$';
  
  -- Sequence mit nächster Nummer starten
  EXECUTE format('CREATE SEQUENCE public.order_number_seq START WITH %s', max_seq + 1);
END;
$$;

-- Funktion mit Sequence-basierter Generierung ersetzen
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_month TEXT;
  seq_num INTEGER;
BEGIN
  year_month := to_char(now(), 'YYYY-MM');
  seq_num := nextval('order_number_seq');
  new_number := 'ORD-' || year_month || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;