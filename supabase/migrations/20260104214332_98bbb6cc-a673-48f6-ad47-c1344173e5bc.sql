-- Adicionar coluna de preferência de busca ao profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS search_preference text DEFAULT NULL;

-- Adicionar coluna de gênero visível (para filtro, não identidade)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS visible_gender text DEFAULT NULL;

-- Criar índices para filtros rápidos
CREATE INDEX IF NOT EXISTS idx_profiles_search_preference ON public.profiles(search_preference);
CREATE INDEX IF NOT EXISTS idx_profiles_visible_gender ON public.profiles(visible_gender);

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.search_preference IS 'What the user is looking for: men, women, or both';
COMMENT ON COLUMN public.profiles.visible_gender IS 'How this profile appears in search: man or woman';