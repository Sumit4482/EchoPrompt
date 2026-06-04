# Brevo SMTP — forgot password

## Required env vars

| Env var | Example |
|---------|---------|
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `your-login@smtp-brevo.com` (from Brevo dashboard) |
| `SMTP_PASS` | Brevo SMTP key (see below) |
| `SMTP_FROM` | `EchoPrompt <noreply@yourdomain.com>` (verified sender in Brevo) |
| `FRONTEND_URL` | Your frontend URL (e.g. `https://your-app.netlify.app`) |

## Where is `SMTP_PASS`?

It is **not** your Gmail password and **not** the Brevo account login password.

1. Log in to [Brevo](https://app.brevo.com)
2. **Settings** (gear) → **SMTP & API** → tab **SMTP**
3. Under **Your SMTP keys**, click **Generate a new SMTP key** or reveal an existing key
4. Copy that long key → that is `SMTP_PASS`

Use the SMTP login shown in Brevo as `SMTP_USER` with that key.

## Render (backend service)

Set environment variables (never commit `SMTP_PASS` to git):

```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your Brevo SMTP login>
SMTP_PASS=<your Brevo SMTP key>
SMTP_FROM=EchoPrompt <noreply@yourdomain.com>
FRONTEND_URL=<your frontend URL>
```

Redeploy backend after saving.

## Local test (`backend/.env`)

Same values; use `FRONTEND_URL=http://localhost:8080` until production frontend is live.

Restart: `npm run dev`

## Verify

1. Login page → Forgot password → email registered on the app
2. Check inbox for **EchoPrompt password reset**
3. Link should open `{FRONTEND_URL}/reset-password?token=...`

If mail fails, check Render logs for `SMTP send failed`.
