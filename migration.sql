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
    DROP TABLE IF EXISTS public.check_in_logs CASCADE;
    DROP TABLE IF EXISTS public.session_bookmarks CASCADE;
    DROP TABLE IF EXISTS public.user_profiles CASCADE;
    DROP TABLE IF EXISTS public.networking_connections CASCADE;

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
        linkedin_pdf_url TEXT,
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
        timezone TEXT DEFAULT 'Asia/Kolkata',
        is_invite_only BOOLEAN DEFAULT false,
        is_volunteer_open BOOLEAN DEFAULT true
    );

    CREATE TABLE public.event_registrations (
        reg_id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        status public.team_status_enum DEFAULT 'PENDING',
        ticket_hash UUID DEFAULT gen_random_uuid() UNIQUE,
        is_checked_in BOOLEAN DEFAULT false,
        checked_in_at TIMESTAMPTZ,
        checked_in_by UUID REFERENCES public.users(id),
        registered_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(event_id, user_id)
    );

    CREATE TABLE public.event_team (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        role public.team_role_enum NOT NULL,
        status public.team_status_enum DEFAULT 'PENDING',
        can_scan_qr BOOLEAN DEFAULT false,
        can_manage_team BOOLEAN DEFAULT false,
        can_manage_tasks BOOLEAN DEFAULT false,
        assigned_by UUID REFERENCES public.users(id),
        UNIQUE(event_id, user_id)
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
    DECLARE
    tag_id_val INTEGER;
    skill TEXT;
    BEGIN
    -- 1. Insert or Update core users table
    INSERT INTO public.users (id, name, email, user_type, phone_number, linkedin_pdf_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
        NEW.email,
        UPPER(COALESCE(NEW.raw_user_meta_data->>'user_type', NEW.raw_user_meta_data->>'attendee_category', 'STUDENT'))::public.user_type_enum,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'mobile_number'),
        NEW.raw_user_meta_data->>'linkedin_pdf_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        user_type = EXCLUDED.user_type,
        phone_number = EXCLUDED.phone_number,
        linkedin_pdf_url = EXCLUDED.linkedin_pdf_url;

    -- 2. Insert into specialized profiles
    IF (LOWER(COALESCE(NEW.raw_user_meta_data->>'user_type', NEW.raw_user_meta_data->>'attendee_category', 'student')) = 'professional') THEN
        INSERT INTO public.professional_profiles (user_id, company_name, designation)
        VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'company', 'Independent'), 
        NEW.raw_user_meta_data->>'designation'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            company_name = EXCLUDED.company_name,
            designation = EXCLUDED.designation;
    ELSE
        INSERT INTO public.student_profiles (user_id, institute_name, course_name)
        VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'college', 'Institution'), 
        NEW.raw_user_meta_data->>'degree'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            institute_name = EXCLUDED.institute_name,
            course_name = EXCLUDED.course_name;
    END IF;

    -- 3. Sync Skills to master_tags and user_interests
    IF (NEW.raw_user_meta_data ? 'skills') THEN
        FOR skill IN SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'skills') LOOP
        INSERT INTO public.master_tags (tag_name) VALUES (skill) ON CONFLICT (tag_name) DO NOTHING;
        SELECT id INTO tag_id_val FROM public.master_tags WHERE tag_name = skill;
        INSERT INTO public.user_interests (user_id, tag_id) VALUES (NEW.id, tag_id_val) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Trigger for new user and profile updates
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
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

    -- Users: Everyone can view basic profile info, owners can update
    CREATE POLICY "Public profiles are viewable by everyone" ON public.users
    FOR SELECT USING (true);

    CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

    -- Profiles: Viewable by everyone, owners can update
    CREATE POLICY "Student profiles are viewable by everyone" ON public.student_profiles
    FOR SELECT USING (true);

    CREATE POLICY "Professional profiles are viewable by everyone" ON public.professional_profiles
    FOR SELECT USING (true);

    -- Events: INSERT allowed only if user_type = 'PROFESSIONAL' (Check table or JWT metadata)
    CREATE POLICY "Professionals can create events" ON public.events FOR INSERT 
    WITH CHECK (
        (owner_id = auth.uid()) AND (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND user_type = 'PROFESSIONAL'
            ) OR (
                LOWER(COALESCE(
                    auth.jwt() -> 'user_metadata' ->> 'user_type',
                    auth.jwt() -> 'user_metadata' ->> 'attendee_category'
                )) = 'professional'
            )
        )
    );

    CREATE POLICY "Events are viewable by everyone" ON public.events
    FOR SELECT USING (true);

    CREATE POLICY "Owners and organizers can update events" ON public.events
    FOR UPDATE USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.event_team
            WHERE event_id = public.events.id AND user_id = auth.uid() AND role = 'ORGANIZER'
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

    CREATE POLICY "Users can register themselves for events" ON public.event_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Organizers can update registrations" ON public.event_registrations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE id = event_registrations.event_id AND owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.event_team
            WHERE event_id = event_registrations.event_id AND user_id = auth.uid() AND can_scan_qr = true
        )
    );

    -- Connections: Users view their own connections and accepted ones
    CREATE POLICY "Users can view their own connections" ON public.user_connections
    FOR SELECT USING (follower_id = auth.uid() OR followed_id = auth.uid() OR status = 'APPROVED');

    CREATE POLICY "Users can manage their own connections" ON public.user_connections
    FOR ALL USING (follower_id = auth.uid() OR followed_id = auth.uid());

    -- Event Team Management
    DROP POLICY IF EXISTS "Users can apply to volunteer" ON public.event_team;
    DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.event_team;
    DROP POLICY IF EXISTS "Owners and organizers can manage team" ON public.event_team;
    DROP POLICY IF EXISTS "Organizers can update team" ON public.event_team;

    -- Security Definer function to break recursion
    CREATE OR REPLACE FUNCTION public.check_team_management(target_event_id INTEGER)
    RETURNS BOOLEAN AS $$
    BEGIN
        RETURN EXISTS (
            SELECT 1 FROM public.events 
            WHERE id = target_event_id AND owner_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.event_team 
            WHERE event_id = target_event_id AND user_id = auth.uid() AND can_manage_team = true
        );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 1. Everyone can see the team
    CREATE POLICY "Team is public" ON public.event_team
    FOR SELECT USING (true);

    -- 2. Users can apply (and later see/cancel their application)
    CREATE POLICY "Users handle own applications" ON public.event_team
    FOR ALL USING (auth.uid() = user_id);

    -- 3. Management Policy (uses function to avoid recursion)
    CREATE POLICY "Management control" ON public.event_team
    FOR ALL USING (public.check_team_management(event_id));

    -- Master Tags: Viewable by everyone
    CREATE POLICY "Master tags are viewable by everyone" ON public.master_tags
    FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can add master tags" ON public.master_tags
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

    -- User Interests: Viewable by everyone, owners can update
    CREATE POLICY "User interests are viewable by everyone" ON public.user_interests
    FOR SELECT USING (true);

    CREATE POLICY "Users can manage own interests" ON public.user_interests
    FOR ALL USING (user_id = auth.uid());

    -- Event Tags: Viewable by everyone, organizers can update
    CREATE POLICY "Event tags are viewable by everyone" ON public.event_tags
    FOR SELECT USING (true);

    CREATE POLICY "Organizers can manage event tags" ON public.event_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE id = public.event_tags.event_id AND (owner_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.event_team
            WHERE event_id = public.event_tags.event_id AND user_id = auth.uid() AND role = 'ORGANIZER'
        )
    );

-- STEP 8: VIEWS FOR UI CONVENIENCE
CREATE OR REPLACE VIEW public.profile_view AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.phone_number,
    u.bio,
    u.profile_pic_url,
    u.user_type,
    u.is_super_admin,
    u.created_at,
    CASE 
        WHEN u.user_type = 'STUDENT' THEN 
            jsonb_build_object(
                'institute_name', s.institute_name,
                'student_id_number', s.student_id_number,
                'course_name', s.course_name
            )
        WHEN u.user_type = 'PROFESSIONAL' THEN 
            jsonb_build_object(
                'company_name', p.company_name,
                'designation', p.designation,
                'linkedin_url', p.linkedin_url,
                'is_verified', p.is_verified
            )
        ELSE NULL
    END as profile_details,
    ARRAY(
        SELECT mt.tag_name 
        FROM public.user_interests ui
        JOIN public.master_tags mt ON ui.tag_id = mt.id
        WHERE ui.user_id = u.id
    ) as interests
FROM public.users u
LEFT JOIN public.student_profiles s ON u.id = s.user_id
LEFT JOIN public.professional_profiles p ON u.id = p.user_id;

-- STEP 9: AGENDA VIEW FOR UI MATCHING
CREATE OR REPLACE VIEW public.agenda_view AS
SELECT 
    e.id::text as id,
    e.title,
    e.description,
    e.start_time,
    e.end_time,
    u.name as speaker,
    COALESCE(p.designation, 'Guest Speaker') as "speakerTitle",
    to_char(e.start_time, 'DD Mon, HH12:MI AM') as time,
    CASE 
        WHEN extract(epoch from (e.end_time - e.start_time))/60 < 60 THEN
            ROUND(extract(epoch from (e.end_time - e.start_time))/60)::text || ' min'
        ELSE
            ROUND(extract(epoch from (e.end_time - e.start_time))/3600, 1)::text || ' hrs'
    END as duration,
    e.venue as location,
    e.owner_id,
    e.timezone,
    COALESCE((
        SELECT mt.tag_name 
        FROM public.event_tags et
        JOIN public.master_tags mt ON et.tag_id = mt.id
        WHERE et.event_id = e.id
        LIMIT 1
    ), 'General') as track,
    ARRAY(
        SELECT mt.tag_name 
        FROM public.event_tags et
        JOIN public.master_tags mt ON et.tag_id = mt.id
        WHERE et.event_id = e.id
    ) as tags,
    true as "isRecommended",
    EXISTS (
        SELECT 1 FROM public.event_registrations er 
        WHERE er.event_id = e.id AND er.user_id = auth.uid() AND (er.status = 'APPROVED' OR (e.is_invite_only = false AND er.status = 'PENDING'))
    ) as "isInAgenda",
    COALESCE((
        SELECT CASE 
            WHEN er.status = 'PENDING' AND e.is_invite_only = false THEN 'APPROVED'
            ELSE er.status::TEXT
        END
        FROM public.event_registrations er 
        WHERE er.event_id = e.id AND er.user_id = auth.uid()
        LIMIT 1
    ), 'NONE') as "registrationStatus",
    EXISTS (
        SELECT 1 FROM public.event_team et
        WHERE et.event_id = e.id AND et.user_id = auth.uid()
    ) as "isTeamMember",
    EXISTS (
        SELECT 1 FROM public.event_team et
        WHERE et.event_id = e.id AND et.user_id = auth.uid() AND et.role = 'ORGANIZER'
    ) as "isOrganizer",
    e.is_volunteer_open,
    e.is_invite_only
FROM public.events e
LEFT JOIN public.users u ON e.owner_id = u.id
LEFT JOIN public.professional_profiles p ON u.id = p.user_id;

-- STEP 10: NETWORKING VIEW
CREATE OR REPLACE VIEW public.networking_view AS
SELECT 
    u.id,
    u.name,
    COALESCE(p.designation, 'Attendee') as title,
    COALESCE(p.company_name, s.institute_name, 'Event Partner') as company,
    COALESCE((
        SELECT e.venue 
        FROM public.event_registrations er
        JOIN public.events e ON er.event_id = e.id
        WHERE er.user_id = u.id
        LIMIT 1
    ), 'Main Hall') as location,
    u.bio,
    ARRAY(
        SELECT mt.tag_name 
        FROM public.user_interests ui
        JOIN public.master_tags mt ON ui.tag_id = mt.id
        WHERE ui.user_id = u.id
    ) as interests,
    95 as "matchPercentage",
    ARRAY(
        SELECT er.event_id
        FROM public.event_registrations er
        WHERE er.user_id = u.id
    ) as event_ids
FROM public.users u
LEFT JOIN public.student_profiles s ON u.id = s.user_id
LEFT JOIN public.professional_profiles p ON u.id = p.user_id;

-- 1. Add the missing column to the users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS linkedin_pdf_url TEXT;

-- 2. Update the handle_new_user function to sync this new field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
tag_id_val INTEGER;
skill TEXT;
BEGIN
INSERT INTO public.users (id, name, email, user_type, phone_number, linkedin_pdf_url)
VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    UPPER(COALESCE(NEW.raw_user_meta_data->>'user_type', NEW.raw_user_meta_data->>'attendee_category', 'STUDENT'))::public.user_type_enum,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'mobile_number'),
    NEW.raw_user_meta_data->>'linkedin_pdf_url'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    user_type = EXCLUDED.user_type,
    phone_number = EXCLUDED.phone_number,
    linkedin_pdf_url = EXCLUDED.linkedin_pdf_url;

    -- 2. Insert into specialized profiles
    IF (LOWER(COALESCE(NEW.raw_user_meta_data->>'user_type', NEW.raw_user_meta_data->>'attendee_category', 'student')) = 'professional') THEN
        INSERT INTO public.professional_profiles (user_id, company_name, designation)
        VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'company', 'Independent'), 
        NEW.raw_user_meta_data->>'designation'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            company_name = EXCLUDED.company_name,
            designation = EXCLUDED.designation;
    ELSE
        INSERT INTO public.student_profiles (user_id, institute_name, course_name)
        VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'college', 'Institution'), 
        NEW.raw_user_meta_data->>'degree'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            institute_name = EXCLUDED.institute_name,
            course_name = EXCLUDED.course_name;
    END IF;

    -- 3. Sync Skills to master_tags and user_interests
    IF (NEW.raw_user_meta_data ? 'skills') THEN
        FOR skill IN SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'skills') LOOP
        INSERT INTO public.master_tags (tag_name) VALUES (skill) ON CONFLICT (tag_name) DO NOTHING;
        SELECT id INTO tag_id_val FROM public.master_tags WHERE tag_name = skill;
        INSERT INTO public.user_interests (user_id, tag_id) VALUES (NEW.id, tag_id_val) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
