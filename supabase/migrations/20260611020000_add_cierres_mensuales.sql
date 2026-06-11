CREATE TABLE public.cierres_mensuales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes integer NOT NULL,
  anio integer NOT NULL,
  total_ingresos numeric NOT NULL DEFAULT 0,
  total_egresos numeric NOT NULL DEFAULT 0,
  saldo_final numeric NOT NULL DEFAULT 0,
  fecha_cierre date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_mes_anio UNIQUE (mes, anio)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cierres_mensuales TO anon, authenticated;
GRANT ALL ON public.cierres_mensuales TO service_role;
ALTER TABLE public.cierres_mensuales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all_cierres_mensuales" ON public.cierres_mensuales FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
