# EchoPrompt — Feature Status

## Product spec
See [PRODUCT.md](./PRODUCT.md) for canonical decisions.

## Recently completed (PM implementation)

| Area | Notes |
|------|--------|
| Core loop | Copy primary; `prompt_copied` analytics; guest save gate copy |
| Blueprints | “Save field recipe”, Blueprints tab copy, template_used events |
| AI & limits | Hosted quota consume fix; UTC hint; BYOK for guests (header + builder) |
| Drafts | Cleared on logout |
| Auth | Username `a-z0-9_` only (API + login form) |
| Ratings | Average shown at 3+ ratings; count always |
| Mobile | Preview toggle below `md`; side-by-side from `md` up |
| Analytics | `POST /analytics/events`; `prompt_saved` on save |
| Deploy docs | env examples, seed scripts in README |

## Still open (ops)

- [ ] Rotate any exposed Gemini key; set only on Render (see README launch notes)
- [ ] Production SMTP on Render (`SMTP_*` + `FRONTEND_URL`) — see backend/env.example
- [ ] Run `npm run seed` + `npm run seed:suggestions` on deploy
- [ ] QA mobile builder on real devices

## Admin

- Set `ADMIN_EMAILS` in backend env — user must register/login with **that exact email** to see `/analytics`
