-- Spanish AI PWA: schema + RLS
-- Run this in Supabase SQL Editor after creating your project.

-- profiles (one per auth user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  accent TEXT NOT NULL DEFAULT 'neutral' CHECK (accent IN ('mexico', 'spain', 'colombia', 'neutral')),
  daily_goal_minutes INTEGER NOT NULL DEFAULT 30 CHECK (daily_goal_minutes IN (15, 30, 45, 60)),
  week INTEGER NOT NULL DEFAULT 1 CHECK (week >= 1 AND week <= 4),
  level_estimate TEXT NOT NULL DEFAULT 'A0' CHECK (level_estimate IN ('A0', 'A1', 'A2')),
  learner_memory TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- households
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Mi hogar',
  invite_code TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- household_members
CREATE TABLE IF NOT EXISTS public.household_members (
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, user_id)
);

-- sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  minutes INTEGER,
  week INTEGER NOT NULL DEFAULT 1,
  mode TEXT NOT NULL DEFAULT 'free_conversation' CHECK (mode IN ('free_conversation', 'roleplay', 'storytelling', 'speed_round', 'debate')),
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.sessions(started_at DESC);

-- session_messages (minimal; allow deletion)
CREATE TABLE IF NOT EXISTS public.session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON public.session_messages(session_id);

-- user_stats_daily (one row per user per day)
CREATE TABLE IF NOT EXISTS public.user_stats_daily (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL DEFAULT 0,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_user_stats_daily_user_date ON public.user_stats_daily(user_id, date DESC);

-- mistake_events
CREATE TABLE IF NOT EXISTS public.mistake_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('ser_estar', 'gender_agreement', 'verb_conjugation', 'word_order', 'articles', 'prepositions', 'other')),
  example_before TEXT NOT NULL,
  example_after TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mistake_events_user_id ON public.mistake_events(user_id);

-- vocab_items
CREATE TABLE IF NOT EXISTS public.vocab_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase_es TEXT NOT NULL,
  phrase_en TEXT,
  context TEXT,
  next_review_date DATE NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vocab_items_user_id ON public.vocab_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_items_next_review ON public.vocab_items(user_id, next_review_date);

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: updated_at for profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Generate invite code helper (optional; can be done in app)
-- Invite codes: 6-char alphanumeric

-- ========== RLS ==========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_items ENABLE ROW LEVEL SECURITY;

-- profiles: user can read/update only own
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- households: members can read; authenticated can read by invite_code to join
CREATE POLICY "households_select_member" ON public.households
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM public.household_members hm
        WHERE hm.household_id = households.id AND hm.user_id = auth.uid()
      )
      OR true
    )
  );
CREATE POLICY "households_insert_owner" ON public.households
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "households_update_owner" ON public.households
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "households_delete_owner" ON public.households
  FOR DELETE USING (auth.uid() = owner_id);

-- household_members: user can see only their own rows (avoids RLS recursion)
CREATE POLICY "household_members_select" ON public.household_members
  FOR SELECT USING (user_id = auth.uid());
-- RPC to list household members (runs as definer, no RLS recursion)
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
CREATE POLICY "household_members_insert_owner" ON public.household_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
    )
    OR
    -- allow self-join by invite code (handled in app: only owner creates member for join)
    (user_id = auth.uid())
  );
CREATE POLICY "household_members_delete_owner_or_self" ON public.household_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
    )
  );

-- sessions: user can CRUD only their own
CREATE POLICY "sessions_select_own" ON public.sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON public.sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON public.sessions
  FOR DELETE USING (auth.uid() = user_id);

-- session_messages: user can CRUD only for their sessions
CREATE POLICY "session_messages_select" ON public.session_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_messages.session_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "session_messages_insert" ON public.session_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_messages.session_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "session_messages_update" ON public.session_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_messages.session_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "session_messages_delete" ON public.session_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_messages.session_id AND s.user_id = auth.uid()
    )
  );

-- user_stats_daily: user can CRUD only their own
CREATE POLICY "user_stats_daily_select_own" ON public.user_stats_daily
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_stats_daily_insert_own" ON public.user_stats_daily
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_stats_daily_update_own" ON public.user_stats_daily
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_stats_daily_delete_own" ON public.user_stats_daily
  FOR DELETE USING (auth.uid() = user_id);

-- mistake_events: user can CRUD only their own
CREATE POLICY "mistake_events_select_own" ON public.mistake_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mistake_events_insert_own" ON public.mistake_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mistake_events_delete_own" ON public.mistake_events
  FOR DELETE USING (auth.uid() = user_id);

-- vocab_items: user can CRUD only their own
CREATE POLICY "vocab_items_select_own" ON public.vocab_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vocab_items_insert_own" ON public.vocab_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vocab_items_update_own" ON public.vocab_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "vocab_items_delete_own" ON public.vocab_items
  FOR DELETE USING (auth.uid() = user_id);
