# Brevo SMTP — forgot password

## Your settings (non-secret)

| Env var | Value |
|---------|--------|
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `acbf20001@smtp-brevo.com` |
| `SMTP_FROM` | `Test <sbanwakde4482@gmail.com>` |
| `FRONTEND_URL` | Your Netlify URL when ready (e.g. `https://echoprompt.netlify.app`) |

## Where is `SMTP_PASS`?

It is **not** your Gmail password and **not** the Brevo account login password.

1. Log in to [Brevo](https://app.brevo.com)
2. **Settings** (gear) → **SMTP & API** → tab **SMTP**
3. Under **Your SMTP keys**, click **Generate a new SMTP key** or reveal an existing key
4. Copy that long key → that is `SMTP_PASS`

Use login `acbf20001@smtp-brevo.com` as `SMTP_USER` with that key.

## Render (backend service)

Set environment variables (never commit `SMTP_PASS` to git):

```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=acbf20001@smtp-brevo.com
SMTP_PASS=<your Brevo SMTP key>
SMTP_FROM=Test <sbanwakde4482@gmail.com>
FRONTEND_URL=<your Netlify URL>
```

Redeploy backend after saving.

## Local test (`backend/.env`)

Same values; use `FRONTEND_URL=http://localhost:8080` until Netlify is live.

Restart: `npm run dev`

## Verify

1. Login page → Forgot password → email registered on the app
2. Check inbox for **EchoPrompt password reset**
3. Link should open `{FRONTEND_URL}/reset-password?token=...`

If mail fails, check Render logs for `SMTP send failed`.
