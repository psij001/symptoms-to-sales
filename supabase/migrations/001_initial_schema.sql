-- ============================================
-- Symptoms to Sales 2.0 - Initial Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- Profiles (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  avatar_url text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'enterprise')),
  onboarding_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- Projects
-- ============================================
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('personal', 'partner', 'client')),
  description text,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- Voice DNA Documents
-- ============================================
create table public.voice_dna (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  file_url text not null,
  file_name text not null,
  content_text text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- Offer Contexts (Worksheets)
-- ============================================
create table public.offer_contexts (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  description text,
  content_json jsonb not null default '{}',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- Folders for Organizing Outputs
-- ============================================
create table public.folders (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  parent_id uuid references public.folders(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- Generated Outputs
-- ============================================
create table public.outputs (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  folder_id uuid references public.folders(id) on delete set null,
  tool_type text not null check (tool_type in ('triangle', 't1-email', 'subject-lines', 'cap')),
  output_subtype text,
  title text,
  content jsonb not null,
  input_context jsonb,
  is_favorite boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- Indexes
-- ============================================
create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_is_active on public.projects(user_id, is_active);
create index idx_voice_dna_project_id on public.voice_dna(project_id);
create index idx_offer_contexts_project_id on public.offer_contexts(project_id);
create index idx_outputs_project_id on public.outputs(project_id);
create index idx_outputs_tool_type on public.outputs(project_id, tool_type);
create index idx_outputs_is_favorite on public.outputs(project_id, is_favorite);
create index idx_folders_project_id on public.folders(project_id);

-- ============================================
-- Row Level Security
-- ============================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.voice_dna enable row level security;
alter table public.offer_contexts enable row level security;
alter table public.outputs enable row level security;
alter table public.folders enable row level security;

-- Profiles: Users can only access their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Projects: Users can only access their own projects
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Voice DNA: Access through project ownership
create policy "Users can access voice_dna through project"
  on public.voice_dna for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = voice_dna.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Offer Contexts: Access through project ownership
create policy "Users can access offer_contexts through project"
  on public.offer_contexts for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = offer_contexts.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Outputs: Access through project ownership
create policy "Users can access outputs through project"
  on public.outputs for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = outputs.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Folders: Access through project ownership
create policy "Users can access folders through project"
  on public.folders for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = folders.project_id
      and projects.user_id = auth.uid()
    )
  );

-- ============================================
-- Functions & Triggers
-- ============================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Ensure only one active project per user
create or replace function public.ensure_single_active_project()
returns trigger as $$
begin
  if new.is_active = true then
    update public.projects
    set is_active = false
    where user_id = new.user_id
    and id != new.id
    and is_active = true;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_project_active_change
  before insert or update of is_active on public.projects
  for each row execute procedure public.ensure_single_active_project();

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at_column();
create trigger update_projects_updated_at before update on public.projects
  for each row execute procedure public.update_updated_at_column();
create trigger update_voice_dna_updated_at before update on public.voice_dna
  for each row execute procedure public.update_updated_at_column();
create trigger update_offer_contexts_updated_at before update on public.offer_contexts
  for each row execute procedure public.update_updated_at_column();
create trigger update_outputs_updated_at before update on public.outputs
  for each row execute procedure public.update_updated_at_column();
create trigger update_folders_updated_at before update on public.folders
  for each row execute procedure public.update_updated_at_column();

-- ============================================
-- Storage Bucket for Voice DNA PDFs
-- ============================================
insert into storage.buckets (id, name, public)
values ('voice-dna', 'voice-dna', false)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can upload voice DNA files"
  on storage.objects for insert
  with check (
    bucket_id = 'voice-dna'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own voice DNA files"
  on storage.objects for select
  using (
    bucket_id = 'voice-dna'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own voice DNA files"
  on storage.objects for delete
  using (
    bucket_id = 'voice-dna'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
