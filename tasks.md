# AI-Guided Meditation MVP — Granular Task Plan (Next.js + Supabase)

> **Principles**
> - Each task is **tiny, single-concern, testable**, with a clear start/end.
> - Prefer **stubs/mocks first**, then swap real services later.
> - Use **feature flags** to gate incomplete pieces.
> - Keep PRs small; each task should be completable in ~15–60 minutes.

---

## Phase 0 — Repo & Tooling

**T-0001: Initialize mono-repo**
- **Start:** New GitHub repo `ai-guru-meditation`.
- **End:** `main` branch with default PR template & .gitignore for Node/Next.
- **Test:** `git clone` succeeds; repo contains `README.md`, `.gitignore`, `.github/PULL_REQUEST_TEMPLATE.md`.

**T-0002: Add Node toolchain**
- **Start:** No package manager set.
- **End:** `package.json` with scripts: `dev`, `build`, `start`, `lint`, `test`.
- **Test:** `npm run build` fails gracefully (no Next project yet).

**T-0003: Configure TypeScript baseline**
- **Start:** No TS config.
- **End:** `tsconfig.json` created with strict mode.
- **Test:** `tsc --noEmit` runs (no files yet, but config loads).

**T-0004: Add ESLint + Prettier**
- **Start:** No lint/format.
- **End:** `.eslintrc.cjs`, `.prettierrc`, lint script.
- **Test:** `npm run lint` executes; returns 0 (no files to lint).

**T-0005: Setup Husky + lint-staged (optional)**
- **Start:** No git hooks.
- **End:** Pre-commit hook runs `lint-staged`.
- **Test:** Commit a file → hook runs.

---

## Phase 1 — Next.js App Scaffolding

**T-0101: Create Next.js (App Router)**
- **Start:** Empty repo.
- **End:** `npx create-next-app@latest` with `--ts` and App Router.
- **Test:** `npm run dev` → open `http://localhost:3000`.

**T-0102: Install TailwindCSS**
- **Start:** No Tailwind.
- **End:** Tailwind configured with `globals.css`, `tailwind.config`.
- **Test:** Add a class (`text-xl`) on `app/page.tsx` and verify visually.

**T-0103: Add base layout + fonts**
- **Start:** Default layout.
- **End:** `app/layout.tsx` with `<main>` structure and a system font stack.
- **Test:** Inspect DOM; wrapper elements present.

**T-0104: Create `components/ui` folder**
- **Start:** No shared UI.
- **End:** Add `Button.tsx`, `Card.tsx` minimal components.
- **Test:** Import in `app/page.tsx` and render.

---

## Phase 2 — Supabase Bootstrap

**T-0201: Install Supabase client**
- **Start:** No supabase packages.
- **End:** `@supabase/supabase-js` installed; `.env.local` with URL + anon key.
- **Test:** In a simple script, `createClient` executes without throwing.

**T-0202: Create `lib/supabaseClient.ts` (browser)**
- **Start:** No helper.
- **End:** Export `createBrowserClient()`.
- **Test:** Import in `app/page.tsx` and call without error.

**T-0203: Create `lib/supabaseServer.ts` (server/RSC)**
- **Start:** No server helper.
- **End:** Export `createServerClient()` (cookies aware).
- **Test:** Use in a server component without runtime error.

**T-0204: Supabase project + schema migration file**
- **Start:** No DB schema.
- **End:** Add `supabase/migrations/0001_init.sql` with tables from architecture.
- **Test:** `supabase db push` applies locally (or to remote).

**T-0205: Enable RLS + policies file**
- **Start:** RLS not set.
- **End:** `supabase/policies.sql` with policies from architecture.
- **Test:** Run script; confirm RLS enabled on target tables.

---

## Phase 3 — Auth (Email link only for MVP)

**T-0301: Auth UI skeleton**
- **Start:** No auth UI.
- **End:** `/app/(marketing)/page.tsx` with "Sign in" button.
- **Test:** Page renders button.

**T-0302: Implement email magic-link sign-in**
- **Start:** Button not functional.
- **End:** Click triggers `supabase.auth.signInWithOtp({ email })` modal flow.
- **Test:** Receive email; after sign-in, `user.id` is available.

**T-0303: Add session context provider**
- **Start:** No context.
- **End:** `AuthProvider` exposing `user`, `session` to client components.
- **Test:** Component reads `user?.id` and displays it.

**T-0304: Protect dashboard route**
- **Start:** Route is public.
- **End:** `/dashboard` redirects to sign-in if unauthenticated.
- **Test:** Private browsing → redirect; signed-in → access granted.

---

## Phase 4 — Base Pages

**T-0401: `/dashboard` minimal list**
- **Start:** Empty page.
- **End:** Render "No sessions yet" by default.
- **Test:** Signed-in user sees placeholder text.

**T-0402: `/meditate` start page**
- **Start:** Not present.
- **End:** Buttons: "Let Guru decide" / "Pick technique".
- **Test:** Buttons render; links stubbed.

**T-0403: `/meditate/live/[sessionId]` placeholder**
- **Start:** Not present.
- **End:** Page renders `sessionId` from params.
- **Test:** Navigate to `/meditate/live/test-id` shows `test-id`.

---

## Phase 5 — State Stores

**T-0501: Install Zustand**
- **Start:** No state lib.
- **End:** `state/useSessionStore.ts` created.
- **Test:** Set and read a dummy field via a test component.

**T-0502: Define SessionState shape**
- **Start:** Empty store.
- **End:** Fields: `sessionId`, `phase`, `technique`, `breath`, `transcript`, `guruQueue`.
- **Test:** Initialize defaults; update & assert via UI log.

**T-0503: Define AudioState shape**
- **Start:** No audio store.
- **End:** Fields: `isRecording`, `level`, `start()`, `stop()`.
- **Test:** Call `start()`/`stop()` change boolean state.

---

## Phase 6 — Sessions API & DB

**T-0601: `/api/sessions` POST create**
- **Start:** No route.
- **End:** Creates session row; returns `{id,status}`.
- **Test:** `curl` returns 200 with `id`; DB has row with `user_id`.

**T-0602: `/api/sessions` GET list**
- **Start:** No list.
- **End:** Returns current user's sessions.
- **Test:** Create 2 sessions; GET returns 2 items.

**T-0603: Client integrate create session**
- **Start:** Button not wired.
- **End:** "Let Guru decide" → POST; navigate to `/meditate/live/[id]`.
- **Test:** Click → navigates to new live page; DB row exists.

---

## Phase 7 — Session Events Table Integration

**T-0701: Add simple insert helper**
- **Start:** No event helper.
- **End:** `lib/events.ts` with `appendEvent(sessionId, kind, payload)`.
- **Test:** Call with dummy; row appears in `session_events`.

**T-0702: Log `phase_change` on page mount**
- **Start:** No logging.
- **End:** On entering live page, log `{phase:'intro'}`.
- **Test:** DB shows event with correct kind/payload.

**T-0703: Dashboard sessions count uses events view**
- **Start:** Static text.
- **End:** Show count of events per session (server component query).
- **Test:** Create events → numbers update.

---

## Phase 8 — Microphone Capture (Stub)

**T-0801: Create `MicCapture.tsx`**
- **Start:** No mic component.
- **End:** Request mic permission; show status.
- **Test:** First-time prompt appears; status updates.

**T-0802: Display live amplitude (client-only)**
- **Start:** No visualization.
- **End:** Use Web Audio API to compute RMS; render a simple bar.
- **Test:** Speaking increases bar height.

**T-0803: Expose `start()` / `stop()` to store**
- **Start:** UI only internal methods.
- **End:** Wire to `useAudioStore` actions.
- **Test:** Trigger start/stop from an external button.

---

## Phase 9 — STT Stub (Local Only)

**T-0901: Create `/api/stt-stream` route (stub)**
- **Start:** No STT route.
- **End:** Accepts POST with text placeholder; echoes partial/final JSON.
- **Test:** `curl` with `{text:"hello"}` returns partial+final.

**T-0902: Client STT client helper**
- **Start:** No helper.
- **End:** `lib/audio/sttClient.ts` that POSTs text for now.
- **Test:** Call returns mocked transcript objects.

**T-0903: Wire Mic → STT (mock via button)**
- **Start:** No pipeline.
- **End:** "Send mock transcript" button posts "I feel anxious".
- **Test:** Store `transcript` appends returned text.

---

## Phase 10 — Guru Turn (LLM Stub First)

**T-1001: `/api/ai/turn` route (stub)**
- **Start:** No AI route.
- **End:** Accept `{sessionId,lastUserText}` and returns canned response.
- **Test:** `curl` returns `{text, nextPhase:'assessment'}`.

**T-1002: Client call to AI turn**
- **Start:** Not wired.
- **End:** On receiving final STT text, POST to AI turn; push result to `guruQueue`.
- **Test:** Trigger mock transcript → AI turn response appears in UI.

**T-1003: Save guru response to events**
- **Start:** Not saved.
- **End:** `/api/ai/turn` persists `guru_question` or `guru_cue` event.
- **Test:** DB shows event after call.

---

## Phase 11 — Breath Pattern + Visual

**T-1101: Add `BreathRing.tsx`**
- **Start:** No ring.
- **End:** Draw ring that scales with a `phase` value (0–1).
- **Test:** Provide a static pattern; ring animates 4s inhale, 4s hold, 4s exhale loop.

**T-1102: Add `breath` to store**
- **Start:** No pattern in store.
- **End:** `breath: { inhale, hold, exhale, cycles }`.
- **Test:** UI reads values and animates accordingly.

**T-1103: Emit `breath_tick` events (throttled)**
- **Start:** No logging.
- **End:** Every cycle end, append `breath_tick` with cycle number.
- **Test:** After 2 cycles, DB has 2 new tick events.

---

## Phase 12 — TTS Stub & Player

**T-1201: `/api/tts-stream` route (stub)**
- **Start:** No TTS route.
- **End:** Returns a short static WAV/PCM byte stream for "Inhale".
- **Test:** `curl` gets audio bytes; playable.

**T-1202: `AudioPlayer.tsx` stream playback**
- **Start:** No player.
- **End:** Fetch stream and play via `AudioContext`.
- **Test:** Clicking "Play sample" produces audio.

**T-1203: Wire guru cues → TTS playback**
- **Start:** Not wired.
- **End:** When `guruQueue` changes, call TTS and play.
- **Test:** Mock AI turn → hear the TTS stub audio.

---

## Phase 13 — Real Providers (Swap Stubs Incrementally)

**T-1301: Feature flag infra**
- **Start:** None.
- **End:** `NEXT_PUBLIC_USE_STUBS=true|false` in env; helper to branch.
- **Test:** Toggle flag switches stub/real code paths.

**T-1302: Integrate real STT provider (HTTP/WS)**
- **Start:** Stub in use.
- **End:** `/api/stt-stream` forwards audio to provider; returns partial/final.
- **Test:** Speak → partials appear; finals stored in events.

**T-1303: Integrate real TTS provider (stream)**
- **Start:** Stub in use.
- **End:** `/api/tts-stream` returns provider stream.
- **Test:** Guru cue → real synthesized voice plays.

**T-1304: Integrate real LLM in `/api/ai/turn`**
- **Start:** Stub logic.
- **End:** Compose system prompt; call provider; parse response.
- **Test:** Given input “I feel anxious”, response suggests box breathing.

---

## Phase 14 — Realtime Channels

**T-1401: `lib/realtime.ts` helper**
- **Start:** None.
- **End:** Join `session:{id}` channel, expose `broadcast(event)`.
- **Test:** Two tabs join; broadcast ping received in both.

**T-1402: Presence primary-tab ownership**
- **Start:** None.
- **End:** Use presence metadata to mark one tab as "owner" (mic allowed).
- **Test:** Open two tabs; only one shows "Mic ready".

**T-1403: Broadcast partial transcripts**
- **Start:** Local only.
- **End:** Server emits partials; UI shows in real time.
- **Test:** Second tab sees partials update.

---

## Phase 15 — Technique Picker & Selector

**T-1501: `/lib/ai/selectors.ts` rule table**
- **Start:** None.
- **End:** Map intents to techniques (static rules).
- **Test:** Unit test: “sleep” → `yoga_nidra` or `body_scan`.

**T-1502: `TechniquePicker.tsx`**
- **Start:** None.
- **End:** Dropdown with techniques; persists to session on start.
- **Test:** Select → session row updated with technique key.

**T-1503: Guru decides path**
- **Start:** Not implemented.
- **End:** If `decided_by='guru'`, `/api/ai/turn` sets technique once confidence high.
- **Test:** After first 2 answers, technique assigned and emitted to UI.

---

## Phase 16 — Finalize Session (Edge Function)

**T-1601: Supabase Edge Function scaffold**
- **Start:** None.
- **End:** `supabase/functions/finalize-session/index.ts` with hello world.
- **Test:** Deploy + call returns 200.

**T-1602: Compute summary from events**
- **Start:** No logic.
- **End:** Load events; compute duration, breaths, avg cadence.
- **Test:** Unit test with fixture events JSON → expected numbers.

**T-1603: Persist to `session_summaries` & mark complete**
- **Start:** Not saved.
- **End:** Insert summary; update `sessions.status='completed'`.
- **Test:** After calling function, DB reflects new rows & status.

**T-1604: Trigger function on end**
- **Start:** Manual only.
- **End:** When user clicks "End Session", call function.
- **Test:** End → dashboard shows new summary.

---

## Phase 17 — Dashboard & Playback

**T-1701: `/dashboard` list sessions from DB**
- **Start:** Placeholder.
- **End:** Server component query lists date/duration.
- **Test:** Create session → appears in list with duration 0 if not finalized.

**T-1702: `/dashboard/sessions/[id]` summary page**
- **Start:** Placeholder.
- **End:** Render transcript, technique, stats.
- **Test:** Completed session shows all fields.

**T-1703: "Repeat this meditation" CTA**
- **Start:** None.
- **End:** Button creates new session with same technique.
- **Test:** Click → navigates to new `/meditate/live/[id]`.

---

## Phase 18 — UX Polishing (MVP Scope)

**T-1801: Add `SessionHUD.tsx` (timer/pause)**
- **Start:** None.
- **End:** Timer shows elapsed; pause toggles breath animation.
- **Test:** Pause stops ring; resume continues.

**T-1802: Add `RealtimeIndicator.tsx`**
- **Start:** None.
- **End:** Shows online/offline channel status.
- **Test:** Toggle network offline → indicator updates.

**T-1803: Accessibility audit**
- **Start:** None.
- **End:** Ensure role/aria labels for buttons, contrasts OK.
- **Test:** Lighthouse accessibility score ≥ 90.

---

## Phase 19 — Testing

**T-1901: Unit tests for selectors**
- **Start:** No tests.
- **End:** Vitest/Jest config + tests for `selectors.ts`.
- **Test:** `npm run test` passes.

**T-1902: API integration tests (routes)**
- **Start:** None.
- **End:** Test `/api/sessions`, `/api/ai/turn` (stub mode).
- **Test:** All pass in CI.

**T-1903: Playwright E2E happy path**
- **Start:** None.
- **End:** Script: sign-in stub → create session → mock STT → get guru cue → see breath ring animate.
- **Test:** CI runs the flow to green.

---

## Phase 20 — Deployment

**T-2001: Vercel project + env vars**
- **Start:** Not deployed.
- **End:** Vercel connected; env vars added (Supabase URL/key, provider keys).
- **Test:** Preview deploy succeeds; `/` loads.

**T-2002: Production Supabase project**
- **Start:** Dev-only.
- **End:** Prod project set; run migrations & policies.
- **Test:** Connect from Vercel preview; queries succeed under RLS.

**T-2003: Observability basic**
- **Start:** None.
- **End:** Add Vercel Analytics; `console.error` → Sentry/PostHog optional.
- **Test:** Analytics events visible in dashboard.

---

## Phase 21 — Service Swaps Checklist

- STT: **stub → provider** ✅
- TTS: **stub → provider** ✅
- LLM: **stub → provider** ✅
- Realtime: **local → channel broadcast** ✅

---

## Phase 22 — Cut MVP

**T-2201: MVP acceptance script**
- **Start:** None.
- **End:** Markdown script with manual QA steps: sign in → start session (guru decides) → speak 2 utterances → receive guidance → hear TTS → see breath ring → end session → view summary.
- **Test:** A new team member completes the script in <10 minutes without assistance.

---

## Appendix — Minimal Definition of Done (DoD)

- Each task has: **diff under 300 LOC**, lint/format clean, tests updated/passing.
- If blocked by external API, implement **stub**, behind feature flag.
- No secrets committed. RLS enforced on all DB queries.
