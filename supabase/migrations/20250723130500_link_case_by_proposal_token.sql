-- Create RPC to link a case to the current authenticated user via a proposal token
-- Security: SECURITY DEFINER with minimal logic; avoids exposing data and bypasses RLS safely
-- Returns the linked caso_id for convenience

CREATE OR REPLACE FUNCTION public.link_case_by_proposal_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_caso_id uuid;
  v_expires timestamptz;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT pt.caso_id, pt.expires_at
  INTO v_caso_id, v_expires
  FROM public.proposal_tokens pt
  WHERE pt.token = p_token
  LIMIT 1;

  IF v_caso_id IS NULL THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  IF v_expires IS NULL OR v_expires < now() THEN
    RAISE EXCEPTION 'token_expired';
  END IF;

  -- Link the case to the user if not already linked; idempotent if the same user
  UPDATE public.casos c
  SET cliente_id = v_user_id
  WHERE c.id = v_caso_id
    AND (c.cliente_id IS NULL OR c.cliente_id = v_user_id);

  RETURN v_caso_id;
END;
$$;

REVOKE ALL ON FUNCTION public.link_case_by_proposal_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_case_by_proposal_token(text) TO authenticated;


