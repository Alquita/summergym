
-- Clients
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  apellido text NOT NULL,
  fecha_nacimiento date,
  edad integer,
  direccion text,
  telefono text,
  telefono_emergencia text,
  plan text,
  estado text NOT NULL DEFAULT 'activo',
  fecha_ingreso date NOT NULL DEFAULT CURRENT_DATE,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO anon, authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all_clientes" ON public.clientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Payments
CREATE TABLE public.pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  client_name text NOT NULL,
  mes text NOT NULL,
  anio integer NOT NULL,
  modalidad_pago text NOT NULL,
  monto numeric NOT NULL,
  fecha_pago date NOT NULL,
  plan text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagos TO anon, authenticated;
GRANT ALL ON public.pagos TO service_role;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all_pagos" ON public.pagos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Cash flow
CREATE TABLE public.flujo_caja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL,
  detalle text NOT NULL,
  ingreso numeric NOT NULL DEFAULT 0,
  egreso numeric NOT NULL DEFAULT 0,
  tipo text NOT NULL,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flujo_caja TO anon, authenticated;
GRANT ALL ON public.flujo_caja TO service_role;
ALTER TABLE public.flujo_caja ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all_flujo_caja" ON public.flujo_caja FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Settings (single row)
CREATE TABLE public.configuracion (
  id integer PRIMARY KEY DEFAULT 1,
  gym_name text NOT NULL DEFAULT 'Summer Gym',
  direccion text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  cuota_mensual numeric NOT NULL DEFAULT 35000,
  dias_alerta integer NOT NULL DEFAULT 5,
  dias_inactividad integer NOT NULL DEFAULT 35,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracion TO anon, authenticated;
GRANT ALL ON public.configuracion TO service_role;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all_configuracion" ON public.configuracion FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.configuracion (id) VALUES (1) ON CONFLICT DO NOTHING;
