# Spanish AI — 4-Week Fluency PWA

Mobile-first Spanish learning PWA with AI-driven conversational practice.

## Folder structure

```
SpanishAI/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # POST: AI chat (OpenAI)
│   │   └── session/end/route.ts  # POST: end session, summarize, save stats/vocab/mistakes
│   ├── app/                      # Protected app (requires auth)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard
│   │   ├── onboarding/page.tsx
│   │   ├── practice/page.tsx + PracticeClient.tsx
│   │   ├── progress/page.tsx
│   │   ├── household/page.tsx + HouseholdClient.tsx
│   │   └── settings/page.tsx + SettingsClient.tsx
│   ├── auth/page.tsx             # Login / signup / magic link
│   ├── layout.tsx
│   ├── page.tsx                  # Landing
│   └── globals.css
├── components/
│   ├── AppNav.tsx
│   └── PWAInstall.tsx
├── lib/
│   ├── ai-prompts.ts             # Tutor system prompt + session summary prompt
│   ├── session-utils.ts          # Mode suggestion, labels, week themes
│   ├── supabase/client.ts
│   ├── supabase/middleware.ts
│   ├── supabase/server.ts
│   └── types.ts
├── public/
│   ├── manifest.json
│   ├── sw.js                     # Service worker
│   └── icons/                    # Add icon-192.png, icon-512.png
├── supabase/
│   └── migrations/001_schema.sql # Tables + RLS
├── .env.example
├── middleware.ts
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
``` Two user profiles, household dashboard, 4-week structured program. Built with Next.js (App Router), Supabase, and OpenAI.

## Features

- **Two profiles**: Separate logins (email/password + magic link), each with streak, minutes, sessions, week (1–4), level estimate, mistakes, and vocab with spaced repetition.
- **Household**: Create or join with invite code; shared dashboard for both users’ progress.
- **Daily practice**: One-tap “Start Session” — no prompts to paste. Auto-generated lesson/mode from week and history. Modes: Free conversation, Roleplay, Storytelling, Speed round, Debate (week 4).
- **AI tutor**: Spanish-only immersion, gentle corrections (corrected version + why + try again), micro-lessons, end-of-session takeaway + phrases + mistake pattern.
- **4-week program**: Week 1 survival + present; Week 2 roleplays + past/future; Week 3 natural conversation + speed; Week 4 immersion + debates.
- **Voice**: Web Speech API for voice input when available (e.g. Android Chrome); text fallback always available.
- **PWA**: Installable on Android (manifest, service worker, install prompt). Offline: shell only; AI requires internet.

## Tech stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend / Auth / DB**: Supabase (email/password, magic link)
- **AI**: OpenAI API via Next.js API routes (key server-side only)
- **Hosting**: Vercel or Netlify

## Local setup

### 1. Clone and install

```bash
cd SpanishAI
npm install
```

### 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the entire contents of `supabase/migrations/001_schema.sql` (creates tables, triggers, RLS).
3. In **Authentication → URL Configuration**, set:
   - **Site URL**: `http://localhost:3000` (local) or your production URL.
   - **Redirect URLs**: `http://localhost:3000/**` and `https://your-domain.com/**`.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
```

- Get URL and anon key from Supabase **Settings → API**.
- Service role key from the same page (keep secret).
- OpenAI key from [platform.openai.com](https://platform.openai.com).

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, set accent/goal (or use Settings), then use **Start Session** to practice.

### 5. PWA icons (optional)

Add app icons so “Add to Home screen” looks correct:

- `public/icons/icon-192.png` (192×192)
- `public/icons/icon-512.png` (512×512)

Without them the app still runs; some browsers may show a generic icon.

---

## Deployment

### Vercel

1. Push the repo to GitHub (or connect your Git provider in Vercel).
2. In [vercel.com](https://vercel.com): **New Project** → import the repo.
3. **Environment Variables**: add all from `.env.example` (use production Supabase URL/keys and your OpenAI key).
4. **Deploy**. Vercel will use the build command `next build`.
5. In Supabase **Authentication → URL Configuration**, add your Vercel URL to **Redirect URLs** (e.g. `https://your-app.vercel.app/**`).
6. Optional: add a custom domain in Vercel and add that to Supabase redirect URLs as well.

### Netlify

1. Push the repo to GitHub and connect it in [Netlify](https://netlify.com) (**Add new site → Import from Git**).
2. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next` (for Next.js you need the Netlify Next.js runtime; or use **Output directory** `out` if you add `next export` / static export — this app uses API routes, so use **Netlify Next.js plugin**).
3. Install **@netlify/plugin-nextjs** so Next.js runs correctly:
   - Create `netlify.toml` in the project root with:
   ```toml
   [build]
     command = "npm run build"
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```
4. **Environment variables**: add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`.
5. Deploy. In Supabase, add the Netlify URL to **Redirect URLs** (e.g. `https://your-app.netlify.app/**`).

---

## PWA install on Android

1. Open the app in **Chrome** (recommended).
2. Tap the browser menu (⋮) → **“Add to Home screen”** or **“Install app”**.
3. Confirm. The icon appears on your home screen; opening it runs the app in standalone mode.
4. Full AI and sync require an internet connection.

---

## Cost and safety

- **Supabase**: Free tier is usually enough for two users; check [supabase.com/pricing](https://supabase.com/pricing).
- **OpenAI**: Pay per token (e.g. GPT-4o-mini). A few short sessions per day typically stay in the low dollars per month; set usage limits in the OpenAI dashboard.
- **Secrets**: `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are only used server-side; never exposed to the client.
- **Data**: No raw audio is stored. Only text (messages, summaries, mistakes, vocab) for progress; users can delete conversation history in Settings.

---

## First-run checklist

- [ ] Supabase project created and `001_schema.sql` run.
- [ ] Auth redirect URLs set for local and production.
- [ ] `.env.local` with Supabase URL, anon key, service role key, and OpenAI key.
- [ ] `npm run dev` runs and [http://localhost:3000](http://localhost:3000) loads.
- [ ] Sign up and log in (email/password or magic link).
- [ ] Create or join a household; second user can join with code.
- [ ] Start a session; send a message; see AI reply; end session and see takeaway.
- [ ] Progress page shows streak/minutes and (after some practice) mistakes/vocab.
- [ ] Settings: change accent, daily goal, week; test “Delete conversation history” if desired.
- [ ] (Optional) Add `icon-192.png` and `icon-512.png` under `public/icons/`.
- [ ] Deploy to Vercel or Netlify and add production URL to Supabase redirect URLs.
