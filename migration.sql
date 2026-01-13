-- Migration Script: Backend Schema Overhaul
-- Goal: Overhaul Event Management Platform Database.

-- STEP 1: CLEANUP
DROP TABLE IF EXISTS public.event_tags CASCADE;
DROP TABLE IF EXISTS public.user_interests CASCADE;
DROP TABLE IF EXISTS public.master_tags CASCADE;
DROP TABLE IF EXISTS public.event_team CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.user_connections CASCADE;
DROP TABLE IF EXISTS public.professional_profiles CASCADE;
DROP TABLE IF EXISTS public.student_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.event_attendees CASCADE;
DROP TABLE IF EXISTS public.connections CASCADE;

-- DROP ENUMS if they exist
DROP TYPE IF EXISTS public.user_type_enum CASCADE;
DROP TYPE IF EXISTS public.team_role_enum CASCADE;
DROP TYPE IF EXISTS public.team_status_enum CASCADE;

-- STEP 2: ENUMS
CREATE TYPE public.user_type_enum AS ENUM ('STUDENT', 'PROFESSIONAL');
CREATE TYPE public.team_role_enum AS ENUM ('ORGANIZER', 'VOLUNTEER');
CREATE TYPE public.team_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- STEP 3: CORE USERS & PROFILES
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    bio TEXT,
    profile_pic_url TEXT,
    user_type public.user_type_enum NOT NULL,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.student_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    institute_name TEXT NOT NULL,
    student_id_number TEXT,
    course_name TEXT
);

CREATE TABLE public.professional_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    designation TEXT,
    linkedin_url TEXT,
    is_verified BOOLEAN DEFAULT false
);

CREATE TABLE public.user_connections (
    id SERIAL PRIMARY KEY,
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    followed_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: EVENTS & QR SYSTEM
CREATE TABLE public.events (
    id SERIAL PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    parent_event_id INTEGER REFERENCES public.events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    venue TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_invite_only BOOLEAN DEFAULT false,
    is_volunteer_open BOOLEAN DEFAULT true
);

CREATE TABLE public.event_registrations (
    reg_id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ticket_hash UUID DEFAULT gen_random_uuid() UNIQUE,
    is_checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES public.users(id),
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.event_team (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role public.team_role_enum NOT NULL,
    status public.team_status_enum DEFAULT 'PENDING',
    can_scan_qr BOOLEAN DEFAULT false,
    can_manage_tasks BOOLEAN DEFAULT false,
    assigned_by UUID REFERENCES public.users(id)
);

-- STEP 5: TAGGING ENGINE
CREATE TABLE public.master_tags (
    id SERIAL PRIMARY KEY,
    tag_name TEXT UNIQUE NOT NULL
);

CREATE TABLE public.user_interests (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES public.master_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tag_id)
);

CREATE TABLE public.event_tags (
    event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES public.master_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, tag_id)
);

-- STEP 6: AUTOMATION - handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type_enum, 'STUDENT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 7: RLS POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;

-- Events: INSERT allowed only if user_type = 'PROFESSIONAL'
CREATE POLICY "Professionals can create events" ON public.events FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_type = 'PROFESSIONAL'
    )
);

-- Registrations: Users view own; Organizers view all for their event
CREATE POLICY "Users view own registrations" ON public.event_registrations
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organizers view all registrations for their event" ON public.event_registrations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE id = event_registrations.event_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.event_team
        WHERE event_id = event_registrations.event_id AND user_id = auth.uid() AND role = 'ORGANIZER'
    )
);
