-- AI Guru Meditation App - Initial Schema Migration
-- This migration creates all the tables needed for the meditation app

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type meditation_technique as enum (
  'box_breathing', 'body_scan', 'mindfulness', 'loving_kindness',
  'mantra', 'transcendental', 'zen', 'yoga_nidra', 'nadi_shodhana'
);

-- Profiles table (extends auth.users)
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  onboarding_completed boolean default false,
  preferred_voice text,            -- e.g., "calm_male_en"
  preferred_language text default 'en',
  created_at timestamptz default now()
);

-- Sessions table
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

-- Session events table (for analytics and real-time data)
create table session_events (
  id bigserial primary key,
  session_id uuid references sessions(id) on delete cascade,
  ts timestamptz default now(),
  kind text,               -- 'user_speech','guru_question','guru_cue','breath_tick','note'
  payload jsonb            -- free-form (partial transcript, inhale:4s, etc.)
);

-- Session summaries table (computed after session ends)
create table session_summaries (
  session_id uuid primary key references sessions(id) on delete cascade,
  total_minutes numeric,
  breaths_count int,
  avg_breath_seconds numeric,
  transcript text,         -- stitched transcript
  insights jsonb,          -- tags: focus score, mood, suggested next steps
  created_at timestamptz default now()
);

-- Techniques table (reference data)
create table techniques (
  key meditation_technique primary key,
  display_name text,
  description text,
  default_duration_min int,
  baseline_pattern jsonb     -- e.g., {"inhale":4,"hold":4,"exhale":4,"cycles":10}
);

-- Scripts table (optional: content library for scripted intros/outros)
create table scripts (
  id uuid primary key default gen_random_uuid(),
  technique meditation_technique,
  locale text default 'en',
  segment text check (segment in ('intro','body','outro')),
  content text
);

-- Insert default techniques
insert into techniques (key, display_name, description, default_duration_min, baseline_pattern) values
('box_breathing', 'Box Breathing', 'A calming technique using equal inhale, hold, and exhale counts', 5, '{"inhale":4,"hold":4,"exhale":4,"cycles":10}'),
('body_scan', 'Body Scan', 'Progressive relaxation focusing on different body parts', 10, '{"inhale":3,"hold":2,"exhale":4,"cycles":15}'),
('mindfulness', 'Mindfulness', 'Present-moment awareness and observation', 15, '{"inhale":4,"hold":1,"exhale":6,"cycles":20}'),
('loving_kindness', 'Loving Kindness', 'Cultivating compassion for self and others', 10, '{"inhale":3,"hold":3,"exhale":5,"cycles":12}'),
('mantra', 'Mantra Meditation', 'Repetition of a sacred word or phrase', 20, '{"inhale":2,"hold":1,"exhale":3,"cycles":30}'),
('transcendental', 'Transcendental', 'Effortless transcending through mantra repetition', 20, '{"inhale":2,"hold":1,"exhale":3,"cycles":30}'),
('zen', 'Zen Meditation', 'Sitting meditation with focus on breath', 25, '{"inhale":4,"hold":1,"exhale":6,"cycles":25}'),
('yoga_nidra', 'Yoga Nidra', 'Deep relaxation and conscious sleep', 30, '{"inhale":3,"hold":2,"exhale":5,"cycles":20}'),
('nadi_shodhana', 'Nadi Shodhana', 'Alternate nostril breathing for balance', 8, '{"inhale":4,"hold":4,"exhale":4,"cycles":12}');

-- Create indexes for better performance
create index idx_sessions_user_id on sessions(user_id);
create index idx_sessions_status on sessions(status);
create index idx_session_events_session_id on session_events(session_id);
create index idx_session_events_ts on session_events(ts);
create index idx_session_events_kind on session_events(kind);
