ChatGPT said:
AI-Guided Meditation App — Architecture (Next.js + Supabase)
0) One-liner

A voice-first Next.js app where users speak to an AI Guru who selects and guides a meditation in real time. Supabase handles auth, data, realtime session streaming, storage, and RLS-secured analytics.

1) Tech Stack

Frontend: Next.js (App Router, RSC), React, TypeScript, Tailwind

State: Zustand (UI/session), React Context (auth), URL params (shareable links)

Audio: Web Audio API, Web Speech / custom STT client, streaming TTS (e.g., provider SDK via WebSocket)

Backend: Next.js Route Handlers /app/api/* (Edge where possible), Supabase Edge Functions (server-side jobs), Supabase Realtime (session channels)

DB/Auth/Storage: Supabase (Postgres + RLS, Auth, Realtime, Storage)

Observability: Vercel Analytics/OG, PostHog (optional), Supabase logs

Infra: Vercel deploy for Next.js; Supabase project for DB/Edge Functions

2) High-Level Architecture
+------------------+       WS/HTTP        +--------------------+
|  Browser (Next)  | <------------------> | Next.js API Routes |
| - UI (RSC+CSR)   |                      | - /api/stt-stream  |
| - Audio capture  |  Supabase SDK        | - /api/tts-stream  |
| - TTS playback   | -------------------> | - /api/ai/turn     |
+--------+---------+   (JWT, Realtime)    | - /api/sessions    |
         |                                 +---------+----------+
         | Realtime (presence/events)                |
         v                                           | Supabase Edge Functions
+--------+-------------------------------+           | (server-side jobs)
|           Supabase (Postgres)          | <---------+ (e.g., finalize session,
| - auth.users                           |             batch analytics)
| - RLS tables for sessions, events      |
| - storage (audio snippets/exports)     |
| - realtime channels (session:uuid)     |
+----------------------------------------+


Flow:

User signs in → JWT from Supabase.

Client opens Realtime channel session:{id}.

User speaks; client streams audio → /api/stt-stream → STT → partial transcripts → UI.

Client posts a turn to /api/ai/turn with context; route calls LLM with Guru system prompt, returns questions or guidance.

App guides breath; optional TTS stream from /api/tts-stream.

All events (questions, answers, breaths, HRV markers) are appended to session_events for analytics.

On end, Edge Function compiles a summary, saves to session_summaries.

3) Directory & File Structure
/
├─ app/
│  ├─ (marketing)/
│  │  └─ page.tsx                     # Public landing page
│  ├─ dashboard/
│  │  ├─ page.tsx                     # List past sessions, streaks, recs
│  │  └─ sessions/[id]/page.tsx       # Session detail playback/summary
│  ├─ meditate/
│  │  ├─ page.tsx                     # Start flow: choose or "decide for me"
│  │  └─ live/[sessionId]/page.tsx    # Live voice session UI
│  ├─ api/
│  │  ├─ ai/
│  │  │  └─ turn/route.ts             # POST: AI “turn” orchestration
│  │  ├─ stt-stream/route.ts          # POST/WS: Audio → STT partials
│  │  ├─ tts-stream/route.ts          # POST/WS: Text → TTS stream
│  │  ├─ sessions/route.ts            # POST: create session; GET: list
│  │  └─ sessions/[id]/events/route.ts# POST: append event (fallback)
│  ├─ layout.tsx
│  └─ page.tsx                        # App index (auth gate → marketing/dashboard)
│
├─ components/
│  ├─ audio/
│  │  ├─ MicCapture.tsx               # Client component for mic & VAD
│  │  ├─ AudioPlayer.tsx              # Streaming TTS player
│  │  └─ Waveform.tsx                 # Real-time amplitude/breath viz
│  ├─ guru/
│  │  ├─ GuruBubble.tsx               # Chat/voice bubble
│  │  └─ BreathRing.tsx               # Inhale/hold/exhale animation
│  ├─ session/
│  │  ├─ SessionHUD.tsx               # Timer, cues, skip/pause
│  │  └─ RealtimeIndicator.tsx
│  ├─ forms/
│  │  └─ TechniquePicker.tsx
│  └─ ui/*                            # Buttons, cards, modals
│
├─ lib/
│  ├─ supabaseClient.ts               # createBrowserClient
│  ├─ supabaseServer.ts               # createServerClient (RSC/route)
│  ├─ ai/
│  │  ├─ guruPrompt.ts                # System prompts & templates
│  │  ├─ llmProvider.ts               # Provider abstraction (OpenAI, etc.)
│  │  └─ selectors.ts                 # Choose technique from answers
│  ├─ audio/
│  │  ├─ sttClient.ts                 # STT client stream helpers
│  │  └─ ttsClient.ts                 # TTS stream helpers
│  ├─ realtime.ts                     # Realtime channel helpers
│  ├─ rls.ts                          # RLS helpers (claims, uid)
│  ├─ types.ts                        # Shared TS types
│  └─ utils.ts
│
├─ state/
│  ├─ useSessionStore.ts              # Zustand: live session state
│  └─ useAudioStore.ts                # Mic levels, device ids, playback
│
├─ supabase/
│  ├─ migrations/
│  │  └─ 0001_init.sql
│  ├─ functions/
│  │  └─ finalize-session/index.ts    # Edge Function to finalize/score
│  └─ policies.sql                    # RLS policies
│
├─ public/
│  └─ audio/tones/*                   # Chimes, start/stop sounds
│
├─ styles/
│  └─ globals.css
│
├─ .env.example
├─ next.config.js
├─ package.json
└─ README.md

4) Data Model (Supabase / Postgres)
-- Users are in auth.users

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  onboarding_completed boolean default false,
  preferred_voice text,            -- e.g., "calm_male_en"
  preferred_language text default 'en',
  created_at timestamptz default now()
);

create type meditation_technique as enum (
  'box_breathing', 'body_scan', 'mindfulness', 'loving_kindness',
  'mantra', 'transcendental', 'zen', 'yoga_nidra', 'nadi_shodhana'
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  started_at timestamptz default now(),
  ended_at timestamptz,
  decided_by text check (decided_by in ('guru','user')),
  technique meditation_technique,            -- chosen technique
  goal text,                                  -- e.g., "sleep", "stress"
  status text check (status in ('live','completed','abandoned')) default 'live'
);

create table session_events (
  id bigserial primary key,
  session_id uuid references sessions(id) on delete cascade,
  ts timestamptz default now(),
  kind text,               -- 'user_speech','guru_question','guru_cue','breath_tick','note'
  payload jsonb            -- free-form (partial transcript, inhale:4s, etc.)
);

create table session_summaries (
  session_id uuid primary key references sessions(id) on delete cascade,
  total_minutes numeric,
  breaths_count int,
  avg_breath_seconds numeric,
  transcript text,         -- stitched transcript
  insights jsonb,          -- tags: focus score, mood, suggested next steps
  created_at timestamptz default now()
);

create table techniques (
  key meditation_technique primary key,
  display_name text,
  description text,
  default_duration_min int,
  baseline_pattern jsonb     -- e.g., {"inhale":4,"hold":4,"exhale":4,"cycles":10}
);

-- Optional: content library for scripted intros/outros
create table scripts (
  id uuid primary key default gen_random_uuid(),
  technique meditation_technique,
  locale text default 'en',
  segment text check (segment in ('intro','body','outro')),
  content text
);

RLS (Row-Level Security) Essentials
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table session_events enable row level security;
alter table session_summaries enable row level security;

create policy "own profile" on profiles
  for select using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own sessions" on sessions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own session events" on session_events
  for all using (
    exists(select 1 from sessions s
           where s.id = session_events.session_id and s.user_id = auth.uid())
  ) with check (
    exists(select 1 from sessions s
           where s.id = session_events.session_id and s.user_id = auth.uid())
  );

create policy "own summaries" on session_summaries
  for select using (
    exists(select 1 from sessions s
           where s.id = session_summaries.session_id and s.user_id = auth.uid())
  );

5) Auth & Identity

Supabase Auth (email magic link, OAuth providers)

Client: createBrowserClient for user session; Server: createServerClient for RSC/route auth.

JWT is forwarded to Route Handlers for secure supabaseServer calls and RLS-backed queries.

6) State Management & Where State Lives

Zustand useSessionStore:

sessionId, technique, status

phase (intro | assessment | breathing | closing)

transcript (rolling), guruQueue (messages/cues)

breathPattern (inhale/hold/exhale timing), current tick

ttsStatus, sttStatus, errors

Zustand useAudioStore:

micDeviceId, speakerDeviceId

isRecording, level, vadActive

playerState (buffered frames, playing)

Server state (Supabase):

Durable facts: sessions, events, summaries, library content

Realtime presence: session:{id} for cross-device or reconnect

7) Services & Connections
/app/api/ai/turn/route.ts

Input: { sessionId, lastUserText, contextHints }

Process:

Fetch session & recent events.

Compose system prompt (Guru persona) + conversation summary.

Decide next step: ask a question, pick technique, or start guidance.

Persist AI output to session_events(kind='guru_question' | 'guru_cue').

Output: { text, nextPhase?, breathPattern? }

/app/api/stt-stream/route.ts (Edge or Node with WS)

Accepts binary PCM/Opus chunks; forwards to STT provider.

Emits partial transcripts → client via same WS or Supabase Realtime.

Persists final segments in session_events(kind='user_speech').

/app/api/tts-stream/route.ts

Accepts { text, voice, sessionId }.

Streams audio frames to client (ReadableStream) for low-latency playback.

Optionally uploads full TTS result to Supabase Storage for replay.

/app/api/sessions/route.ts

POST: create new session (decided_by = 'guru' | 'user', optional desired technique).

GET: list user sessions (dashboard).

/app/api/sessions/[id]/events/route.ts

Fallback POST to append client-side events (e.g., breath ticks, UI markers) when offline from Realtime.

Supabase Edge Function finalize-session

Triggered when session status flips to completed or after inactivity timeout.

Aggregates events → compute stats, create session_summaries, generate a short “Insight” from LLM (server-side).

8) Guru Prompting (Overview)

lib/ai/guruPrompt.ts

System persona: calm, compassionate meditation expert. Avoid medical claims.

Capabilities: assessment, technique selection, pacing instructions, contextual adjustments (anxiety, sleepiness, energy).

Guardrails: time-boxed guidance, safety notes (don’t practice while driving), language tone.

Selector (lib/ai/selectors.ts):

Rules + lightweight model to map intents→meditation_technique.

Examples:

“can’t sleep” → body_scan or yoga_nidra

“panic/stress now” → box_breathing

“self-compassion” → loving_kindness

9) Voice Pipeline (Client)

MicCapture.tsx

Web Audio capture (MediaStream), VAD (energy threshold) to chunk speech.

Sends chunks over WebSocket to /api/stt-stream.

Displays waveform and live partial text.

AudioPlayer.tsx

Plays streaming TTS chunks as they arrive (MediaSource / AudioContext).

Cross-fades between guru utterances; handles pause/resume.

BreathRing.tsx

Animates inhale/hold/exhale by pattern; emits breath_tick events to server (throttled).

10) Realtime

Subscribe to realtime.channel('session:{id}')

Broadcasts: guru_cue, partial_transcript, phase_change, breath_pattern.

Presence: use to detect multi-tab joins; primary tab owns mic.

If Realtime disconnects, client queues events locally; flushes when reconnected.

11) Frontend Routes (UX Brief)

/ (marketing): hero, demo video, privacy.

/dashboard: session history, streak, total minutes, preferred voice.

/meditate: choose technique or “Let Guru decide”.

/meditate/live/[sessionId]: voice UI (mic, transcript, breath ring, pause/stop).

/dashboard/sessions/[id]: summary, transcript, insights, “Repeat this meditation”.

12) Security & Privacy

RLS everywhere; never query without auth.uid().

PII minimalism: store only what’s needed. Mark transcripts as user-owned content.

Secrets: .env in Vercel:

NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY (Edge Functions only)

LLM_API_KEY, STT_API_KEY, TTS_API_KEY

Content safety: Guru avoids medical diagnoses; shows emergency disclaimer.

13) Example Client ↔ Server Sequence
User speaks → MicCapture → WS /api/stt-stream → partial "I feel anxious"
                                                   |
Dashboard observes Realtime 'partial_transcript' ←+
Client POST /api/ai/turn {sessionId, lastUserText:"I feel anxious"}
Server→LLM: decide technique (box_breathing), pattern {4-4-4 x 10}
Server saves events {guru_cue:"We'll try box breathing"}, {breath_pattern}
Client receives response → sets phase=breathing, starts BreathRing + TTS
Breath ticks sent (local), summarized at end by Edge Function

14) API Contracts (condensed)

POST /api/sessions

{ "decidedBy": "guru", "technique": null, "goal": "stress relief" }


→ 200 { "id": "uuid", "status": "live" }

POST /api/ai/turn

{ "sessionId":"uuid", "lastUserText":"I feel anxious before bed" }


→

{
  "text": "Let's try gentle box breathing...",
  "nextPhase": "breathing",
  "breathPattern": { "inhale":4, "hold":4, "exhale":4, "cycles":10 }
}


WS /api/stt-stream

Client → Server: binary audio frames

Server → Client: {type:"partial", text:"..."} | {type:"final", text:"..."}

Persist finals only.

POST/Stream /api/tts-stream

{ "sessionId":"uuid", "text":"Inhale...2...3...4", "voice":"calm_male_en" }


Response: audio stream (chunks).

15) Client Stores (Zustand Examples)

state/useSessionStore.ts

type BreathPattern = { inhale:number; hold:number; exhale:number; cycles:number };
type Phase = 'intro'|'assessment'|'breathing'|'closing';

interface SessionState {
  sessionId?: string;
  phase: Phase;
  technique?: string;
  breath?: BreathPattern;
  transcript: string[];
  guruQueue: string[];
  setPhase(p:Phase): void;
  setBreath(b:BreathPattern): void;
  pushTranscript(line:string): void;
  pushGuru(line:string): void;
  reset(): void;
}


state/useAudioStore.ts

interface AudioState {
  isRecording: boolean;
  level: number;
  start(): Promise<void>;
  stop(): void;
  setDevice(id:string): void;
}

16) Edge Function: finalize-session

Input: { sessionId }

Steps:

Load session_events by sessionId.

Compute duration, breaths, average cadence.

Generate short insight (LLM): “You responded best to holds of 3–4s…”

Insert into session_summaries.

Mark session status='completed'.

17) Migrations & Policies Files

supabase/migrations/0001_init.sql → schema above.

supabase/policies.sql → RLS statements above.

Apply via Supabase CLI.

18) Storage Layout (optional)
/storage
  /sessions/{userId}/{sessionId}/
    transcript.json
    tts/
      intro.mp3
      guidance-part-1.mp3

19) Analytics

session_events is your event log; build views:

vw_user_daily_minutes

vw_technique_popularity

vw_breath_cadence_stats

Client-side: PostHog/Vercel for UI funnel (start, mic permission, first word, first breath).

20) Error Handling & Resilience

Mic permission denied → fallback to typed chat with on-screen pacing.

STT fail → show Tap-to-hold push-to-talk.

TTS fail → on-screen text cues with metronome chime.

Realtime drop → local queue; flush via /api/sessions/[id]/events.

21) Environment Variables (.env.example)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Edge Functions
LLM_API_KEY=
STT_API_KEY=
TTS_API_KEY=

22) Deployment

Next.js → Vercel (Edge runtime for AI/streams when possible).

Supabase → Hosted project; push migrations with CLI; deploy Edge Functions.

Set CORS for API routes to allow app origin.

23) Testing Strategy

Unit: selectors (technique choice), prompt builders.

Integration: Route handlers with mocked Supabase & provider SDKs.

E2E: Playwright—happy path voice session (mock mic & STT/TTS), RLS access tests.

24) Future Extensions

Wearables (HRV/SpO₂) → adaptive pacing.

Background Sounds mixer with on-device looping.

Offline mode: local scripts for common techniques (no LLM).

Group sessions: host broadcasts pacing; members follow.

25) Quick Start Checklist

Create Supabase project → run migrations/0001_init.sql & policies.sql.

Add .env with Supabase + provider keys.

Implement minimal providers in lib/ai/llmProvider.ts, lib/audio/sttClient.ts, lib/audio/ttsClient.ts.

Build /api/sessions, /api/ai/turn, /api/stt-stream, /api/tts-stream.

Wire MicCapture ↔ STT, AudioPlayer ↔ TTS, BreathRing ↔ breathPattern.

Launch on Vercel; verify RLS with a second account.
