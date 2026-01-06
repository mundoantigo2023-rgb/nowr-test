-- Adicionar coluna para identificar perfis de teste
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_test_profile boolean DEFAULT false;

-- Função que cria interesse recíproco automaticamente para perfis de teste
CREATE OR REPLACE FUNCTION public.auto_match_test_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_is_test boolean;
BEGIN
  -- Verificar se o perfil destino é um perfil de teste
  SELECT is_test_profile INTO target_is_test
  FROM profiles
  WHERE user_id = NEW.to_user_id;

  -- Se for perfil de teste, criar interesse recíproco automaticamente
  IF target_is_test = true THEN
    INSERT INTO interests (from_user_id, to_user_id)
    VALUES (NEW.to_user_id, NEW.from_user_id)
    ON CONFLICT (from_user_id, to_user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger que executa após inserir interesse
DROP TRIGGER IF EXISTS trigger_auto_match_test_profiles ON interests;
CREATE TRIGGER trigger_auto_match_test_profiles
  AFTER INSERT ON interests
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_match_test_profiles();