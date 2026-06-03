# EchoPrompt — Feature Status

## Recently completed

| Feature | Notes |
|---------|--------|
| Forgot password | `POST /auth/forgot-password`, `POST /auth/reset-password`; dev returns token |
| Profile edit | Profile menu → Edit profile; `PUT /auth/profile` |
| Make public on save | Checkbox in builder footer |
| Generate vs Save | `POST /prompts/generate` preview-only; persist on `POST /prompts/save` |
| Analytics UI | `/analytics` — overview, trending, insights, leaderboard, export |
| Prompt rating | Stars on Community cards; `POST /prompts/:id/rate` |
| Guest UX | Banner on dashboard when logged out |
| Dead code | Removed `Library.tsx`, `generatePromptLocal` |
| Route guards | `/my-prompts`, `/my-templates`, `/analytics` protected |
| Mobile builder | `activePanel` toggle + extra bottom padding on builder tab |

## Still open

- [ ] Email delivery for password reset (production)
- [ ] Template categories route order bug (if still present)
- [ ] My Templates — edit template UI
- [ ] Remove hardcoded Gemini fallback key in backend (if any)
- [ ] QA mobile builder/preview on real devices
