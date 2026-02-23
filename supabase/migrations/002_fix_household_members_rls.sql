-- Fix infinite recursion: stop querying household_members inside its own policy.
-- 1) Allow each user to see only their OWN rows in household_members (no recursion).
-- 2) Add an RPC that returns all members of a household (runs as definer, no RLS).

-- Remove the recursive SELECT policy and replace with simple "own rows only"
DROP POLICY IF EXISTS "household_members_select" ON public.household_members;

CREATE POLICY "household_members_select" ON public.household_members
  FOR SELECT USING (user_id = auth.uid());

-- Optional: drop the helper if it existed (no longer used)
DROP FUNCTION IF EXISTS public.get_my_household_ids();

-- RPC: return (user_id, display_name) for all members of a household.
-- Caller must be a member of that household; runs as definer so can read all rows.
CREATE OR REPLACE FUNCTION public.get_household_members(p_household_id uuid)
RETURNS TABLE(user_id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hm.user_id, p.display_name
  FROM public.household_members hm
  LEFT JOIN public.profiles p ON p.id = hm.user_id
  WHERE hm.household_id = p_household_id
  AND EXISTS (
    SELECT 1 FROM public.household_members m
    WHERE m.household_id = p_household_id AND m.user_id = auth.uid()
  );
$$;
