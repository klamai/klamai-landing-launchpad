
-- Agregar la columna updated_at que falta en la tabla casos
ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Actualizar registros existentes que no tengan updated_at
UPDATE public.casos 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Crear un trigger para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger a la tabla casos
DROP TRIGGER IF EXISTS update_casos_updated_at ON public.casos;
CREATE TRIGGER update_casos_updated_at
    BEFORE UPDATE ON public.casos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
