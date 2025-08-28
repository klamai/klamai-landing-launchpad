-- Tabla mínima de comunicaciones para log y anti-duplicados
CREATE TABLE IF NOT EXISTS public.comunicaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canal text NOT NULL,                  -- 'whatsapp'
  tipo text NOT NULL,                   -- 'presupuesto_informativo', etc.
  caso_id uuid REFERENCES public.casos(id),
  destinatario_numero text NOT NULL,
  cuerpo text NOT NULL,
  media_url text,
  estado text NOT NULL DEFAULT 'enviado', -- 'enviado' | 'fallo'
  error text,
  enviado_at timestamptz DEFAULT now()
);

-- ÍNDICE único para evitar duplicados por caso+tipo en whatsapp
CREATE UNIQUE INDEX IF NOT EXISTS comunicaciones_unique_idx
  ON public.comunicaciones(caso_id, tipo)
  WHERE canal = 'whatsapp';


