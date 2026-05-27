# EchoPrompt — Feature Status & Todo

## Feature Status

| # | Feature | Status |
|---|---------|--------|
| 1 | Login / Register flow | ✅ Done |
| 2 | JWT session (persist + refresh) | ✅ Done |
| 3 | Live prompt preview | ✅ Done |
| 4 | AI generate via Gemini | ✅ Done |
| 5 | Save prompt (authenticated) | ✅ Done |
| 6 | Save / load template (dialog) | ✅ Done |
| 7 | Public library (browse templates + prompts) | ✅ Done |
| 8 | My Prompts — view, copy, delete, export | ✅ Done |
| 9 | My Templates — view, copy, delete, use | ✅ Done |
| 10 | Community Hub (public prompts feed) | ✅ Done |
| 11 | Use template → auto-fill builder | ✅ Done |
| 12 | Settings dialog (theme, tone, format, AI prefs) | ✅ Done |
| 13 | Anonymous user preferences (MongoDB) | ✅ Done |
| 14 | Keyboard shortcuts | ✅ Done |
| 15 | Gemini API key override (localStorage) | ✅ Done |
| 16 | Seed data + seeder script | ✅ Done |
| 17 | Backend analytics events (log/query) | ✅ Done (backend only) |
| 18 | Backend user stats / activity / export | ✅ Done (backend only) |
| 19 | Backend leaderboard | ✅ Done (backend only) |
| 20 | Backend prompt rating | ✅ Done (backend only) |
| 21 | Use prompt from Library → builder | ❌ Broken |
| 22 | Template categories API | ❌ Broken (route order bug) |
| 23 | My Templates — Edit template | ❌ Stub (no-op) |
| 24 | Forgot password | ❌ Not implemented |
| 25 | Route guards (protected pages) | ❌ Missing |
| 26 | Mobile builder/preview panel toggle | ❌ Incomplete |
| 27 | Analytics dashboard UI | ❌ Missing |
| 28 | User profile edit UI | ❌ Missing |
| 29 | Make prompt public toggle | ❌ Missing |
| 30 | Prompt rating UI | ❌ Missing |

---

## Todo List

### 🔴 Critical Bugs

- [ ] **SECURITY** — Remove hardcoded fallback Gemini API key from `backend/src/services/geminiService.ts`
- [ ] **BUG** — Fix `GET /api/templates/categories/list` route shadowed by `GET /api/templates/:id` (move categories route before `/:id`)
- [ ] **BUG** — `Library → Use Prompt`: `PromptBuilder` never reads `localStorage.selectedPrompt` — builder silently ignores it
- [ ] **BUG** — Password length mismatch: frontend allows 6 chars, backend requires 8 — register can pass UI and fail API

### 🟠 Auth & Navigation

- [ ] Add route guards — redirect unauthenticated users from `/my-prompts`, `/my-templates` to `/login`
- [ ] Remove demo-mode fallback toasts in `MyPrompts` and `PromptBuilder` that fake success on API failure
- [ ] Forgot password — backend route (`POST /auth/forgot-password`) + frontend handler in `Login.tsx`

### 🟡 Missing UI for Existing Backend

- [ ] **Make prompt public** — add toggle in `PromptBuilder` save flow (`isPublic` always `false` now)
- [ ] **Edit template** — wire up Edit button in `MyTemplates` dropdown (backend `PUT /templates/:id` exists)
- [ ] **User profile edit** — form to update name/preferences (backend `PUT /auth/profile` exists)
- [ ] **Prompt rating** — star rating UI in `PromptPreview` or library cards (backend `POST /prompts/:id/rate` exists)
- [ ] **Analytics dashboard** — page or tab showing `getOverview`, `getTrending`, `getUserInsights` (all backend endpoints ready)

### 🟢 Polish & UX

- [ ] Mobile dashboard — wire `activePanel` state to actually show/hide builder vs preview columns on small screens
- [ ] Fix `NotFound.tsx` — use React Router `<Link>` instead of `<a>`, apply dark theme consistent with app
- [ ] Clean up dead API client methods in `src/services/api.ts` (`generatePromptLocal`, orphan analytics methods) or connect them
- [ ] Reduce `TOAST_REMOVE_DELAY` in `use-toast.ts` (currently 1,000,000 ms — toasts never auto-dismiss)
