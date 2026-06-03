# EchoPrompt — Product decisions

## Core loop
- User writes **task** (required), picks values from **per-field dropdowns** (suggestions) → **structured preview** — copy to ChatGPT/Claude; no AI required.
- **Blueprints tab** = full field recipes loaded into builder (not duplicated inside builder).
- **Enhance with AI** is optional polish (hosted Gemini + limits, or BYOK unlimited).

## AI
- **Free hosted AI** via server `GEMINI_API_KEY` with daily limits (guest: 10, signed-in: 30 — configurable).
- **Own Gemini key** (profile menu) = unlimited; key stored in browser, sent only when enhancing.
- Fallback to structured `buildPromptText` if enhance fails (clear toast).

## Auth
- Login with **email or username**.
- Forgot password via SMTP (Brevo etc.).
- Profile: name, email, username, prompt defaults.

## Prompts
- **Generate** = preview only (no DB write).
- **Save** = persist; update when opened from My Prompts.
- **Draft** in `localStorage` after successful generate.

## Blueprints vs Community (UI)
- **Blueprints** tab: reusable field recipes → “Start from blueprint”.
- **Community** tab: full shared prompts → “Use shared prompt”.

## Monetization
- None for now — no paywall; subscription badges hidden in UI.

## Deploy
- Frontend: Netlify · Backend: Render · DB: MongoDB Atlas
