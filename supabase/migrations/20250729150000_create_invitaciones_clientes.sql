-- Crear tabla para invitaciones de clientes
CREATE TABLE IF NOT EXISTS invitaciones_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID NOT NULL UNIQUE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_invitaciones_clientes_token ON invitaciones_clientes(token);
CREATE INDEX IF NOT EXISTS idx_invitaciones_clientes_profile_id ON invitaciones_clientes(profile_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_clientes_caso_id ON invitaciones_clientes(caso_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_clientes_expires_at ON invitaciones_clientes(expires_at);

-- Habilitar RLS
ALTER TABLE invitaciones_clientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para invitaciones_clientes
-- Solo superadmin puede crear invitaciones
CREATE POLICY "SuperAdmin puede crear invitaciones" ON invitaciones_clientes
  FOR INSERT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Solo superadmin puede ver invitaciones
CREATE POLICY "SuperAdmin puede ver invitaciones" ON invitaciones_clientes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Solo superadmin puede actualizar invitaciones
CREATE POLICY "SuperAdmin puede actualizar invitaciones" ON invitaciones_clientes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Función para limpiar invitaciones expiradas
CREATE OR REPLACE FUNCTION limpiar_invitaciones_expiradas()
RETURNS void AS $$
BEGIN
  DELETE FROM invitaciones_clientes 
  WHERE expires_at < NOW() AND used = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Crear un job para limpiar invitaciones expiradas (se ejecutará manualmente por ahora)
-- En el futuro se puede configurar con pg_cron si está disponible 