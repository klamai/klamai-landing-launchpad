-- Crear tabla para documentos de resolución
CREATE TABLE public.documentos_resolucion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caso_id UUID NOT NULL,
  abogado_id UUID NOT NULL,
  tipo_documento TEXT NOT NULL DEFAULT 'resolucion',
  nombre_archivo TEXT NOT NULL,
  ruta_archivo TEXT NOT NULL,
  tamaño_archivo INTEGER,
  descripcion TEXT,
  version INTEGER DEFAULT 1,
  es_version_final BOOLEAN DEFAULT false,
  fecha_subida TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.documentos_resolucion ENABLE ROW LEVEL SECURITY;

-- Política para que los abogados vean documentos de sus casos asignados o si son super admin
CREATE POLICY "Abogados ven documentos de sus casos" 
ON public.documentos_resolucion 
FOR SELECT 
USING (
  -- Super admin puede ver todos
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  )
  OR 
  -- Abogado que subió el documento
  auth.uid() = abogado_id
  OR
  -- Cliente propietario del caso que ha pagado
  EXISTS (
    SELECT 1 FROM public.casos c
    JOIN public.pagos p ON p.usuario_id = c.cliente_id
    WHERE c.id = documentos_resolucion.caso_id 
    AND c.cliente_id = auth.uid()
    AND p.estado = 'succeeded'
  )
);

-- Política para que solo abogados asignados puedan subir documentos
CREATE POLICY "Solo abogados asignados pueden subir documentos" 
ON public.documentos_resolucion 
FOR INSERT 
WITH CHECK (
  -- Super admin puede subir a cualquier caso
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  )
  OR
  -- Abogado asignado al caso puede subir documentos
  EXISTS (
    SELECT 1 FROM public.asignaciones_casos 
    WHERE caso_id = documentos_resolucion.caso_id 
    AND abogado_id = auth.uid() 
    AND estado_asignacion = 'activa'
  )
);

-- Configurar storage bucket para documentos legales (si no existe)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos_legales', 'documentos_legales', false)
ON CONFLICT (id) DO NOTHING;

-- Política de storage para documentos legales - solo lectura para usuarios autorizados
CREATE POLICY "Usuarios autorizados pueden leer documentos legales" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documentos_legales' 
  AND (
    -- Super admin puede leer todo
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'abogado' 
      AND tipo_abogado = 'super_admin'
    )
    OR
    -- Abogado propietario del archivo
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Cliente que ha pagado puede leer sus documentos de casos
    EXISTS (
      SELECT 1 FROM public.documentos_resolucion dr
      JOIN public.casos c ON c.id = dr.caso_id
      JOIN public.pagos p ON p.usuario_id = c.cliente_id
      WHERE dr.ruta_archivo = name
      AND c.cliente_id = auth.uid()
      AND p.estado = 'succeeded'
    )
  )
);

-- Política de storage para subir documentos legales
CREATE POLICY "Abogados pueden subir documentos legales" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documentos_legales' 
  AND (
    -- Super admin puede subir
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'abogado' 
      AND tipo_abogado = 'super_admin'
    )
    OR
    -- Abogados pueden subir a su carpeta
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Política de storage para actualizar documentos legales
CREATE POLICY "Abogados pueden actualizar sus documentos legales" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'documentos_legales' 
  AND (
    -- Super admin puede actualizar
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'abogado' 
      AND tipo_abogado = 'super_admin'
    )
    OR
    -- Abogados pueden actualizar sus archivos
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Política de storage para eliminar documentos legales
CREATE POLICY "Abogados pueden eliminar sus documentos legales" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documentos_legales' 
  AND (
    -- Super admin puede eliminar
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'abogado' 
      AND tipo_abogado = 'super_admin'
    )
    OR
    -- Abogados pueden eliminar sus archivos
    auth.uid()::text = (storage.foldername(name))[1]
  )
);