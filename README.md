# AI-Guided Meditation App

A voice-first Next.js app where users speak to an AI Guru who selects and guides a meditation in real time. Supabase handles auth, data, realtime session streaming, storage, and RLS-secured analytics.

## Tech Stack

- **Frontend**: Next.js (App Router, RSC), React, TypeScript, Tailwind
- **Backend**: Next.js Route Handlers, Supabase Edge Functions
- **Database**: Supabase (Postgres + RLS, Auth, Realtime, Storage)
- **Audio**: Web Audio API, Web Speech API, streaming TTS
- **State**: Zustand (UI/session), React Context (auth)

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run development server: `npm run dev`

## Architecture

See `architecture.md` for detailed technical specifications.

## Development Tasks

See `tasks.md` for the complete task breakdown and development plan.
