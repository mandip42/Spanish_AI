-- Fix infinite recursion in household_members RLS.
-- The SELECT policy was querying household_members inside itself. Use a SECURITY DEFINER
-- function so we look up the user's households without triggering RLS on household_members.

CREATE OR REPLACE FUNCTION public.get_my_household_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.household_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "household_members_select" ON public.household_members;

CREATE POLICY "household_members_select" ON public.household_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR household_id IN (SELECT public.get_my_household_ids())
  );
