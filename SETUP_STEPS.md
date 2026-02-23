# Step-by-step: From files created to running app

Follow these in order. When you're done, you'll have the app running locally and ready to deploy.

---

## Step 1: Install dependencies

In the project folder, run:

```bash
cd c:\Users\gomandip\Documents\Cursor_Project\SpanishAI
npm install
```

Wait until it finishes without errors.

---

## Step 2: Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New project**.
3. Choose an organization (or create one), name the project (e.g. `spanish-ai`), set a database password (save it somewhere), pick a region, then **Create new project**.
4. Wait until the project is ready (green status).

---

## Step 3: Run the database schema in Supabase

1. In the Supabase dashboard, open your project.
2. In the left sidebar, click **SQL Editor**.
3. Click **New query**.
4. Open the file `supabase/migrations/001_schema.sql` in your editor, select all, and copy it.
5. Paste the full SQL into the Supabase SQL Editor.
6. Click **Run** (or press Ctrl+Enter).
7. Check the bottom of the screen: it should say **Success** with no red errors. If you see errors, fix them (e.g. typo, missing comma) and run again.

---

## Step 4: Get Supabase URL and keys

1. In Supabase, go to **Settings** (gear icon in the left sidebar).
2. Click **API**.
3. You’ll see:
   - **Project URL** (e.g. `https://xxxx.supabase.co`) → you’ll use this as `NEXT_PUBLIC_SUPABASE_URL`.
   - **Project API keys**:
     - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role** (click “Reveal” if needed) → `SUPABASE_SERVICE_ROLE_KEY`  
     Keep the service_role key secret; never commit it or use it in frontend code.

---

## Step 5: Set Supabase auth redirect URLs

1. In Supabase, go to **Authentication** → **URL Configuration**.
2. Under **Redirect URLs**, add (one per line):
   - `http://localhost:3000/**`
   - If you already have a production URL, also add: `https://your-domain.com/**`
3. Click **Save**.

---

## Step 6: Get an OpenAI API key

1. Go to [platform.openai.com](https://platform.openai.com) and sign in (or create an account).
2. Open **API keys** (in the menu or profile).
3. Click **Create new secret key**, name it (e.g. “Spanish AI”), create it, and **copy the key** (starts with `sk-`). You won’t see it again.

---

## Step 7: Create your local env file

1. In the project folder, copy the example env file:
   - **Windows (PowerShell):**  
     `Copy-Item .env.example .env.local`
   - **Or manually:** duplicate `.env.example` and rename the copy to `.env.local`.
2. Open `.env.local` and fill in the values (no quotes needed):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-step-4
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-step-4
   OPENAI_API_KEY=sk-your-openai-key-from-step-6
   ```

3. Save the file.  
   Make sure `.env.local` is in `.gitignore` (it already is) so you don’t commit secrets.

---

## Step 8: Run the app locally

1. In the project folder, run:

   ```bash
   npm run dev
   ```

2. When you see something like “Ready on http://localhost:3000”, open a browser and go to:  
   **http://localhost:3000**

---

## Step 9: Confirm the main flows

Do these in the browser:

1. **Landing**  
   You should see the Spanish AI landing page with “Get started” and “Log in”.

2. **Sign up**  
   Click **Get started** → sign up with email and password (or use **Log in** and then **Send magic link**).  
   If you use magic link, check your email and open the link.

3. **After login**  
   You should be redirected to `/app` (dashboard). If you’re asked to set preferences, set accent and daily goal and continue.

4. **Household**  
   Go to **Household** → **Create household**. Copy the invite code.  
   (Optional: open an incognito window, sign up with a second account, go to Household, **Join with code**, paste the code, and confirm both accounts see each other on the household dashboard.)

5. **Practice**  
   Go to **Practice** → choose a mode (or leave the suggested one) → **Start Session**.  
   Type a short message in Spanish (e.g. “Hola, ¿cómo estás?”) and send. You should get an AI reply in Spanish.  
   Click **End session** and check that you see a short “One takeaway” message.

6. **Progress**  
   Go to **Progress**. You should see today’s minutes and streak; after a session, vocab and mistakes may appear.

7. **Settings**  
   Go to **Settings**. Change accent or daily goal, save. Optionally try “Delete conversation history” (type DELETE and confirm).

---

## Step 10: (Optional) Add PWA icons

So “Add to Home screen” shows your own icon:

1. Create or obtain two square images: 192×192 and 512×512 pixels (PNG).
2. Put them in the project as:
   - `public/icons/icon-192.png`
   - `public/icons/icon-512.png`
3. Restart `npm run dev` if it’s running. The manifest already points to these paths.

---

## You’re at the “end”

At this point:

- All folders and files are created.
- Dependencies are installed.
- Supabase project exists and schema + RLS are applied.
- Auth redirect URLs are set.
- Env vars are in `.env.local`.
- The app runs with `npm run dev` and you’ve verified landing, auth, household, practice, progress, and settings.

**Next (when you want to go live):**  
Use the **Deployment** section in `README.md` to deploy to Vercel or Netlify, then add your production URL to Supabase **Authentication → URL Configuration → Redirect URLs**.
