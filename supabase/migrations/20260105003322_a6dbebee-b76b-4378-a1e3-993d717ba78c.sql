-- Allow users to delete messages in their matches (for chat expiration cleanup)
CREATE POLICY "Users can delete messages in their matches" 
ON public.messages 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM matches 
  WHERE matches.id = messages.match_id 
  AND (matches.user_a = auth.uid() OR matches.user_b = auth.uid())
));

-- Allow users to delete matches they are part of (for chat expiration cleanup)
CREATE POLICY "Users can delete their own matches" 
ON public.matches 
FOR DELETE 
USING (auth.uid() = user_a OR auth.uid() = user_b);