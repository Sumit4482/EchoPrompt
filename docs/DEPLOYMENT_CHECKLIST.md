# EchoPrompt — Deployment checklist

Use this in order. Check off as you go.

---

## A. Before you deploy (secrets & accounts)

- [ ] **Google AI Studio** — revoke old Gemini keys; create **one new** key (never paste in chat again)
- [ ] **Brevo** — SMTP key active; sender `Test <sbanwakde4482@gmail.com>` verified
- [ ] **MongoDB** — Atlas cluster **or** Render Postgres/Mongo from `render.yaml` (`echoprompt-db`)
- [ ] **GitHub** — latest code pushed to repo Render/Netlify will build from
- [ ] **Admin account** — plan to register/login as `sbanwakde4482@gmail.com` for `/analytics`

---

## B. Render — backend (`echoprompt-backend`)

Set in **Environment** (Dashboard → service → Environment):

| Variable | Value | Status |
|----------|--------|--------|
| `NODE_ENV` | `production` | in yaml |
| `PORT` | `10000` | in yaml |
| `MONGODB_URI` | From Render DB or Atlas connection string | you set |
| `JWT_SECRET` | Long random string (or auto-generated) | you set |
| `GEMINI_API_KEY` | **New** rotated key | you set |
| `GEMINI_MODEL` | `gemini-2.5-flash` | optional |
| `HOSTED_AI_LIMIT_GUEST` | `10` | in yaml |
| `HOSTED_AI_LIMIT_AUTH` | `30` | in yaml |
| `ADMIN_EMAILS` | `sbanwakde4482@gmail.com` | in yaml |
| `CORS_ORIGIN` | Your **live frontend URL** (no trailing slash) | **pending** |
| `FRONTEND_URL` | Same as frontend URL (for reset emails) | **pending** |
| `SMTP_HOST` | `smtp-relay.brevo.com` | you set |
| `SMTP_PORT` | `587` | in yaml |
| `SMTP_SECURE` | `false` | in yaml |
| `SMTP_USER` | `acbf20001@smtp-brevo.com` | you set |
| `SMTP_PASS` | Brevo SMTP key (from dashboard) | you set |
| `SMTP_FROM` | `Test <sbanwakde4482@gmail.com>` | you set |

Deploy steps:

- [ ] Connect repo → create **Web Service** (or Blueprint from `render.yaml`)
- [ ] Build: `cd backend && npm install && npm run build`
- [ ] Start: `cd backend && npm start`
- [ ] Deploy succeeds; health: open `https://<backend>.onrender.com/api` (or your health route)
- [ ] **Seed production DB** (one-time, from local with prod `MONGODB_URI` or Render shell):
  ```bash
  cd backend && npm run seed && npm run seed:suggestions
  ```

---

## C. Frontend (Netlify **or** Render static)

### Option 1 — Netlify (recommended in PRODUCT.md)

- [ ] `netlify.toml` in repo sets `publish = "dist"` (fixes white screen if UI was wrong)
- [ ] New site from Git; build command: `npm run build` (or use netlify.toml)
- [ ] Publish directory: **`dist`** (must NOT be repo root / empty)
- [ ] Env: `VITE_API_URL=https://<your-backend>.onrender.com/api`
- [ ] Note live URL → go back to Render and set `CORS_ORIGIN` + `FRONTEND_URL` to that URL
- [ ] Redeploy **backend** after CORS/FRONTEND_URL change

### Option 2 — Render static (`echoprompt-frontend` in yaml)

- [ ] `VITE_API_URL=https://<backend>.onrender.com/api`
- [ ] Set backend `CORS_ORIGIN` + `FRONTEND_URL` to Render static site URL

---

## D. Post-deploy smoke test (production URLs)

- [ ] Open `/` — builder loads, suggestions work
- [ ] Guest — type task → **Copy** works
- [ ] **Register** / login as `sbanwakde4482@gmail.com`
- [ ] **Enhance** — quota message or success
- [ ] **Save** prompt; toggle **Share to community**
- [ ] **Blueprints** tab — load a blueprint
- [ ] **Community** — see public prompts
- [ ] **Forgot password** — email arrives; reset link uses correct `FRONTEND_URL`
- [ ] **Analytics** — `/analytics` visible when logged in as admin email
- [ ] Phone — builder / preview toggle works

---

## E. Security (do within 24h of launch)

- [ ] Rotate **Brevo SMTP key** (was pasted in chat) → update Render + local `.env`
- [ ] Rotate **Gemini key** if ever pasted in chat → Render only
- [ ] Confirm no `.env` committed: `git status` clean of secrets
- [ ] MongoDB Atlas IP allowlist / Render DB not publicly open without auth

---

## F. Nice to have (not blocking first deploy)

- [ ] Custom domain on Netlify + HTTPS
- [ ] Render paid plan if you need no cold starts
- [ ] Error monitoring (Sentry) on backend
- [ ] Real-device mobile QA
- [ ] Community moderation workflow

---

## Quick status (your project today)

| Item | Status |
|------|--------|
| App / product code | Ready for beta |
| SMTP local (`backend/.env`) | Configured |
| SMTP on Render | **You must paste `SMTP_PASS` + redeploy** |
| `FRONTEND_URL` / `CORS_ORIGIN` | **Waiting on frontend URL** |
| `VITE_API_URL` on frontend | **Waiting on backend URL** |
| Gemini on Render | **New key required** |
| DB seed on prod | **Not done until after first deploy** |
| Legal line on login | Removed |

---

## When frontend URL is known

1. Set Netlify (or Render) env `VITE_API_URL`
2. Set Render `CORS_ORIGIN` + `FRONTEND_URL` = frontend URL
3. Redeploy backend
4. Run forgot-password test again
