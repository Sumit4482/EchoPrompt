# EchoPrompt — Product spec

## Success metric (priority)
1. **Copy** structured prompt to external AI
2. **Save** to My Prompts
3. **Enhance** (optional)

## Core loop
- User writes **task** (required), fills fields via suggestions → **structured preview** → **Copy** (no AI required).
- **Blueprints** tab = reusable field recipes → “Start from blueprint”.
- **Enhance** = optional polish (hosted Gemini + daily limits, or BYOK unlimited).

## Guest vs signed-in

| Capability | Guest | Signed-in |
|------------|-------|-----------|
| Builder, suggestions, search, copy | Yes | Yes |
| Blueprints browse, Community browse | Yes | Yes |
| Save prompts, My library, share toggle | No | Yes |
| Hosted AI quota | 10/day | 30/day |
| BYOK (browser key) | Yes, unlimited Enhance | Yes |

Quota resets **midnight UTC**.

## AI
- **Hosted:** `GEMINI_API_KEY` on server only (never in repo).
- **BYOK:** `localStorage` key, sent only on Enhance; skips hosted quota.
- Enhance updates **preview text only**, not form fields.
- On failure/limit: structured `buildPromptText` still works; clear toast.

## Naming
- **Blueprints** = field recipes (My Blueprints / `My Templates` route).
- **Prompts** = saved generated text + fields.
- Builder menu: **Save field recipe** (not “template”).

## Community
- **Share to community** = `isPublic` on save; toggle later in My Prompts edit.
- One document per save; update in place (no duplicate publish).

## Auth
- Login: email **or** username.
- Username: 3–30 chars, `a-z`, `0-9`, `_` only, globally unique.
- Forgot password: SMTP in production; dev token only when `NODE_ENV=development` and email not sent.

## Drafts
- Single `localStorage` draft after Enhance.
- **Cleared on logout.**

## Settings defaults
- Apply to **empty** tone/format only when user saves Settings (explicit).
- **Reset** clears all fields; no defaults injected.

## Ratings
- Show rating **count** when N > 0.
- Show **average** when N ≥ 3; before that count only (“Early ratings”).

## Analytics (admin)
- `user.role === 'admin'` or email in `ADMIN_EMAILS`.
- Overview + trending; **no CSV export** in v1.

## Deploy
- Frontend: Netlify · Backend: Render · DB: MongoDB Atlas
- `VITE_API_URL` → Render `/api`
- Run `cd backend && npm run seed && npm run seed:suggestions` after deploy

## Monetization
- None in v1; no Pro paywall UI.
