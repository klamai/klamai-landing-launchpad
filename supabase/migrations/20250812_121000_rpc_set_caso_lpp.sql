CREATE OR REPLACE FUNCTION public.set_caso_listo_para_propuesta(p_caso_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.casos
  SET estado = 'listo_para_propuesta', updated_at = now()
  WHERE id = p_caso_id AND cliente_id = auth.uid();
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.set_caso_listo_para_propuesta(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_caso_listo_para_propuesta(uuid) TO authenticated;

