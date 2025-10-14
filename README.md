# AI-Guided Meditation App

A voice-first Next.js app where users speak to an AI Guru who selects and guides a meditation in real time. Supabase handles auth, data, realtime session streaming, storage, and RLS-secured analytics.

## Tech Stack

- **Frontend**: Next.js (App Router, RSC), React, TypeScript, Tailwind
- **Backend**: Next.js Route Handlers, Supabase Edge Functions
- **Database**: Supabase (Postgres + RLS, Auth, Realtime, Storage)
- **Audio**: Web Audio API with ElevenLabs TTS for narrated guidance
- **State**: Zustand (UI/session), React Context (auth)

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
   - Provide `ELEVENLABS_API_KEY` with your ElevenLabs secret key
   - Optionally set `ELEVENLABS_VOICE_ID` to choose a different ElevenLabs voice
4. Copy `.env.example` to `env/.env.local` (or a similar `.env*` file) and fill in your own secrets
   - `cp .env.example env/.env.local`
   - Provide `ELEVENLABS_API_KEY` with your ElevenLabs secret key
   - Optionally set `ELEVENLABS_VOICE_ID` to choose a different ElevenLabs voice (defaults to the Grandpa voice `NOpBlnGInO9m6vDvFkFC`)
   - All `.env*` files live in the `env/` directory so Next.js can load them via the configured `experimental.envDir`
   - These env files are ignored by git so your secret stays hidden
5. Run development server: `npm run dev`

## Deploying on Render

The repository includes a `render.yaml` blueprint that provisions the app as a Render Node Web Service. If you are configuring the service through the Render dashboard instead, use the following settings so the build succeeds and Next.js can bind to Render's port:

- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run start -- --hostname 0.0.0.0 --port $PORT`
- **Publish Directory**: _leave blank_ (the app is server-rendered and does not emit a static `build/` folder)

Make sure to add the required environment variables (`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`, and `ELEVENLABS_OUTPUT_FORMAT`) so the voice synthesis route can reach ElevenLabs in production.

## Architecture

See `architecture.md` for detailed technical specifications.

## Development Tasks

See `tasks.md` for the complete task breakdown and development plan.
