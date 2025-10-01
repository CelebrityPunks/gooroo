-- AI Guru Meditation App - Row Level Security Policies
-- This file contains all RLS policies for the meditation app

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table session_events enable row level security;
alter table session_summaries enable row level security;
alter table techniques enable row level security;
alter table scripts enable row level security;

-- Profiles policies
create policy "own profile" on profiles
  for select using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "update own profile" on profiles
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "insert own profile" on profiles
  for insert with check (auth.uid() = user_id);

-- Sessions policies
create policy "own sessions" on sessions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Session events policies
create policy "own session events" on session_events
  for all using (
    exists(select 1 from sessions s
           where s.id = session_events.session_id and s.user_id = auth.uid())
  ) with check (
    exists(select 1 from sessions s
           where s.id = session_events.session_id and s.user_id = auth.uid())
  );

-- Session summaries policies
create policy "own summaries" on session_summaries
  for select using (
    exists(select 1 from sessions s
           where s.id = session_summaries.session_id and s.user_id = auth.uid())
  );

create policy "insert own summaries" on session_summaries
  for insert with check (
    exists(select 1 from sessions s
           where s.id = session_summaries.session_id and s.user_id = auth.uid())
  );

-- Techniques policies (public read access)
create policy "techniques are viewable by everyone" on techniques
  for select using (true);

-- Scripts policies (public read access)
create policy "scripts are viewable by everyone" on scripts
  for select using (true);

-- Create a function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Grant necessary permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, service_role;
grant all privileges on all sequences in schema public to postgres, service_role;

-- Grant specific permissions to authenticated users
grant select, insert, update, delete on sessions to authenticated;
grant select, insert, update, delete on session_events to authenticated;
grant select, insert on session_summaries to authenticated;
grant select on techniques to authenticated;
grant select on scripts to authenticated;
grant select, insert, update on profiles to authenticated;

-- Grant permissions to anonymous users for techniques and scripts (public content)
grant select on techniques to anon;
grant select on scripts to anon;
