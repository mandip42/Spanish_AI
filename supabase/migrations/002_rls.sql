-- RLS Policies for Spanish AI PWA

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistake_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_items ENABLE ROW LEVEL SECURITY;

-- Profiles: user can read/update only own
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Households: members can read; owner can update/delete
CREATE POLICY "households_select_member" ON households FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = households.id AND hm.user_id = auth.uid()
    )
  );
CREATE POLICY "households_insert_owner" ON households FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "households_update_owner" ON households FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = households.id AND hm.user_id = auth.uid() AND hm.role = 'owner'
    )
  );
CREATE POLICY "households_delete_owner" ON households FOR DELETE
  USING (auth.uid() = owner_id);

-- Household members: members can read; owner can manage
CREATE POLICY "household_members_select_member" ON household_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id AND hm.user_id = auth.uid()
    )
  );
CREATE POLICY "household_members_insert_owner" ON household_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
    )
  );
CREATE POLICY "household_members_insert_self_join" ON household_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "household_members_delete_owner" ON household_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
    )
  );
CREATE POLICY "household_members_delete_self" ON household_members FOR DELETE
  USING (auth.uid() = user_id);

-- Sessions: user can CRUD only their own
CREATE POLICY "sessions_all_own" ON sessions FOR ALL USING (auth.uid() = user_id);

-- Session messages: user can CRUD only for their sessions
CREATE POLICY "session_messages_select_own" ON session_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_messages.session_id AND s.user_id = auth.uid())
  );
CREATE POLICY "session_messages_insert_own" ON session_messages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_messages.session_id AND s.user_id = auth.uid())
  );
CREATE POLICY "session_messages_update_own" ON session_messages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_messages.session_id AND s.user_id = auth.uid())
  );
CREATE POLICY "session_messages_delete_own" ON session_messages FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_messages.session_id AND s.user_id = auth.uid())
  );

-- User stats daily: user can CRUD only their own
CREATE POLICY "user_stats_daily_all_own" ON user_stats_daily FOR ALL USING (auth.uid() = user_id);

-- Mistake events: user can CRUD only their own
CREATE POLICY "mistake_events_all_own" ON mistake_events FOR ALL USING (auth.uid() = user_id);

-- Vocab items: user can CRUD only their own
CREATE POLICY "vocab_items_all_own" ON vocab_items FOR ALL USING (auth.uid() = user_id);
