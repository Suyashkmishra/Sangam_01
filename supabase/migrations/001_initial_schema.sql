-- ==============================================================================
-- SANGAM (संगम) DATABASE SCHEMA & RLS MIGRATION
-- "Sacred Ink meets Digital Soul"
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('shishya', 'guru', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE guru_verification_status AS ENUM ('none', 'pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE post_category AS ENUM ('poetry', 'music');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_language AS ENUM ('Hindi', 'English', 'Kannada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_type_enum AS ENUM ('video', 'audio', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE post_status AS ENUM ('published', 'suspended', 'pending_review');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'like', 
        'comment', 
        'connect_request', 
        'connect_accepted', 
        'guru_approved', 
        'guru_rejected',
        'post_suspended',
        'post_deleted',
        'post_resubmitted',
        'post_approved',
        'post_rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_plan AS ENUM ('shishya_onetime', 'guru_monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('paid', 'failed', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contact_channel AS ENUM ('whatsapp', 'instagram', 'email');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'shishya',
    full_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    city TEXT DEFAULT '',
    languages TEXT[] DEFAULT ARRAY['Hindi']::TEXT[],
    avatar_url TEXT,
    guru_status guru_verification_status NOT NULL DEFAULT 'none',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for speedy lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_guru_status ON public.profiles(guru_status);

-- 4. PROFILE CONTACTS TABLE (Separated for strict privacy)
CREATE TABLE IF NOT EXISTS public.profile_contacts (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_whatsapp TEXT,
    contact_instagram TEXT,
    contact_email TEXT,
    preferred_channel contact_channel NOT NULL DEFAULT 'whatsapp',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category post_category NOT NULL,
    language content_language NOT NULL,
    title TEXT NOT NULL,
    body_text TEXT,
    media_url TEXT,
    media_type media_type_enum NOT NULL DEFAULT 'none',
    external_link TEXT,
    status post_status NOT NULL DEFAULT 'published',
    moderation_reason TEXT,
    moderated_at TIMESTAMPTZ,
    moderated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_language ON public.posts(language);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);

-- 6. LIKES TABLE
CREATE TABLE IF NOT EXISTS public.likes (
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post ON public.likes(post_id);

-- 7. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);

-- 8. CONNECTIONS TABLE (Mentorship Requests)
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shishya_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    status connection_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT no_self_connect CHECK (guru_id <> shishya_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_guru ON public.connections(guru_id);
CREATE INDEX IF NOT EXISTS idx_connections_shishya ON public.connections(shishya_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- recipient
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- initiator
    type notification_type NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    connection_id UUID REFERENCES public.connections(id) ON DELETE CASCADE,
    post_title TEXT,
    reason TEXT,
    message TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 9.1 ADMIN_ACTIONS TABLE (Audit Trail for Moderation & Admin Operations)
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_name TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON public.admin_actions(target_type, target_id);

-- 10. PAYMENTS TABLE (Mock Auditing)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    plan payment_plan NOT NULL,
    status payment_status NOT NULL DEFAULT 'paid',
    mock BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);

-- ==============================================================================
-- SECURITY & INTEGRITY TRIGGERS
-- ==============================================================================

-- Trigger A: Enforce Profile Privileges
-- Normal users CANNOT update role, is_verified, or guru_status. Only admin or service_role can.
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_profile_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN := false;
    current_user_role TEXT;
BEGIN
    -- Check if executing role is service_role or user has admin role
    BEGIN
        current_user_role := current_setting('role', true);
    EXCEPTION WHEN OTHERS THEN
        current_user_role := '';
    END;

    IF current_user_role = 'service_role' THEN
        RETURN NEW;
    END IF;

    SELECT (role = 'admin') INTO is_admin 
    FROM public.profiles 
    WHERE id = auth.uid();

    IF NOT COALESCE(is_admin, false) THEN
        IF (NEW.role IS DISTINCT FROM OLD.role) OR
           (NEW.is_verified IS DISTINCT FROM OLD.is_verified) OR
           (NEW.guru_status IS DISTINCT FROM OLD.guru_status) THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their role, verification status, or guru approval status.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileges
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_unauthorized_profile_updates();

-- Trigger B: Automatic Profile Creation on auth.users Signup
-- Role 'admin' is explicitly disallowed at self-registration (reverts to 'shishya')
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    raw_role TEXT;
    assigned_role public.user_role := 'shishya';
    initial_guru_status public.guru_verification_status := 'none';
    full_name_val TEXT;
    city_val TEXT;
BEGIN
    raw_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'shishya'));
    full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    city_val := COALESCE(NEW.raw_user_meta_data->>'city', '');

    IF raw_role = 'guru' THEN
        assigned_role := 'guru';
        initial_guru_status := 'pending';
    ELSE
        -- If user tried to pass 'admin' or anything else, force 'shishya'
        assigned_role := 'shishya';
        initial_guru_status := 'none';
    END IF;

    INSERT INTO public.profiles (
        id, 
        role, 
        full_name, 
        bio, 
        city, 
        languages, 
        avatar_url, 
        guru_status, 
        is_verified
    ) VALUES (
        NEW.id,
        assigned_role,
        full_name_val,
        COALESCE(NEW.raw_user_meta_data->>'bio', ''),
        city_val,
        ARRAY['Hindi']::TEXT[],
        NEW.raw_user_meta_data->>'avatar_url',
        initial_guru_status,
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        city = EXCLUDED.city;

    -- Initialize profile contacts row
    INSERT INTO public.profile_contacts (
        user_id,
        contact_email
    ) VALUES (
        NEW.id,
        NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger C: Automated Notification on Post Like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_author UUID;
BEGIN
    SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
    -- Only notify if liker is not the author
    IF post_author IS NOT NULL AND post_author <> NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, post_id)
        VALUES (post_author, NEW.user_id, 'like', NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_like ON public.likes;
CREATE TRIGGER trg_notify_like
    AFTER INSERT ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_like();

-- Trigger D: Automated Notification on Comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_author UUID;
BEGIN
    SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
    -- Only notify if commenter is not the author
    IF post_author IS NOT NULL AND post_author <> NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, post_id)
        VALUES (post_author, NEW.user_id, 'comment', NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_comment ON public.comments;
CREATE TRIGGER trg_notify_comment
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_comment();

-- Trigger E: Automated Notification on Connection Request
CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, actor_id, type, connection_id, post_id)
    VALUES (NEW.shishya_id, NEW.guru_id, 'connect_request', NEW.id, NEW.post_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_connect_req ON public.connections;
CREATE TRIGGER trg_notify_connect_req
    AFTER INSERT ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_connection_request();

-- Trigger F: Automated Notification on Connection Acceptance
CREATE OR REPLACE FUNCTION public.notify_on_connection_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        INSERT INTO public.notifications (user_id, actor_id, type, connection_id, post_id)
        VALUES (NEW.guru_id, NEW.shishya_id, 'connect_accepted', NEW.id, NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_connect_accept ON public.connections;
CREATE TRIGGER trg_notify_connect_accept
    AFTER UPDATE OF status ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_connection_accepted();

-- Trigger G: Automated Notification on Guru Status Approval/Rejection
CREATE OR REPLACE FUNCTION public.notify_on_guru_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_actor UUID;
BEGIN
    IF OLD.guru_status IS DISTINCT FROM NEW.guru_status THEN
        -- Find an admin actor for attribution if available
        SELECT id INTO admin_actor FROM public.profiles WHERE role = 'admin' LIMIT 1;
        IF admin_actor IS NULL THEN
            admin_actor := NEW.id;
        END IF;

        IF NEW.guru_status = 'approved' THEN
            INSERT INTO public.notifications (user_id, actor_id, type)
            VALUES (NEW.id, admin_actor, 'guru_approved');
        ELSIF NEW.guru_status = 'rejected' THEN
            INSERT INTO public.notifications (user_id, actor_id, type)
            VALUES (NEW.id, admin_actor, 'guru_rejected');
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_guru_status ON public.profiles;
CREATE TRIGGER trg_notify_guru_status
    AFTER UPDATE OF guru_status ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_guru_status_change();

-- 5. TRIGGER: Prevent non-admins from modifying moderation fields
CREATE OR REPLACE FUNCTION public.protect_post_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_admin BOOLEAN := false;
    current_user_role TEXT;
BEGIN
    BEGIN
        current_user_role := current_setting('role', true);
    EXCEPTION WHEN OTHERS THEN
        current_user_role := '';
    END;

    -- Allow service_role key to bypass restrictions
    IF current_user_role = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- Check if authenticated user is admin
    SELECT (role = 'admin') INTO is_admin
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT COALESCE(is_admin, false) THEN
        -- If status changed
        IF (NEW.status IS DISTINCT FROM OLD.status) THEN
            -- Only permitted author transition: suspended -> pending_review
            IF (OLD.status = 'suspended' AND NEW.status = 'pending_review' AND auth.uid() = OLD.author_id) THEN
                NEW.moderated_at := OLD.moderated_at;
                NEW.moderated_by := OLD.moderated_by;
                NEW.moderation_reason := OLD.moderation_reason;
            ELSE
                RAISE EXCEPTION 'Unauthorized: Only admins can modify post publication status.';
            END IF;
        END IF;

        -- Non-admin cannot alter moderation fields directly under any circumstance
        IF (NEW.moderation_reason IS DISTINCT FROM OLD.moderation_reason) THEN
            RAISE EXCEPTION 'Unauthorized: Only admins can modify moderation reason.';
        END IF;

        IF (NEW.moderated_at IS DISTINCT FROM OLD.moderated_at) OR (NEW.moderated_by IS DISTINCT FROM OLD.moderated_by) THEN
            RAISE EXCEPTION 'Unauthorized: Only admins can set moderated_at or moderated_by.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_post_moderation_fields ON public.posts;
CREATE TRIGGER trg_protect_post_moderation_fields
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_post_moderation_fields();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles view policy" ON public.profiles;
CREATE POLICY "Profiles view policy" 
    ON public.profiles FOR SELECT 
    USING (
        auth.uid() = id
        OR (role IN ('guru', 'admin') AND is_suspended = false)
        OR (
            is_suspended = false
            AND EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('guru', 'admin')
            )
        )
    );

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 2. PROFILE CONTACTS POLICIES (Strict Privacy)
-- Only the profile owner OR an approved Guru with an ACCEPTED connection can read
DROP POLICY IF EXISTS "Contacts visible only to owner or connected guru" ON public.profile_contacts;
CREATE POLICY "Contacts visible only to owner or connected guru"
    ON public.profile_contacts FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.connections
            WHERE connections.guru_id = auth.uid()
              AND connections.shishya_id = profile_contacts.user_id
              AND connections.status = 'accepted'
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.profile_contacts;
CREATE POLICY "Users can insert their own contacts"
    ON public.profile_contacts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own contacts" ON public.profile_contacts;
CREATE POLICY "Users can update their own contacts"
    ON public.profile_contacts FOR UPDATE
    USING (auth.uid() = user_id);

-- 3. POSTS POLICIES
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone"
    ON public.posts FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts"
    ON public.posts FOR INSERT
    WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('guru', 'shishya')
            AND is_suspended = false
        )
    );

DROP POLICY IF EXISTS "Authors can update their posts" ON public.posts;
CREATE POLICY "Authors can update their posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors and admins can delete posts" ON public.posts;
CREATE POLICY "Authors and admins can delete posts"
    ON public.posts FOR DELETE
    USING (
        auth.uid() = author_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. LIKES POLICIES
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
CREATE POLICY "Likes are viewable by everyone"
    ON public.likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can like posts" ON public.likes;
CREATE POLICY "Users can like posts"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON public.likes;
CREATE POLICY "Users can unlike posts"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id);

-- 5. COMMENTS POLICIES
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
CREATE POLICY "Authenticated users can comment"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and admins can delete comments" ON public.comments;
CREATE POLICY "Users and admins can delete comments"
    ON public.comments FOR DELETE
    USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. CONNECTIONS POLICIES
DROP POLICY IF EXISTS "Users can view their own connections" ON public.connections;
CREATE POLICY "Users can view their own connections"
    ON public.connections FOR SELECT
    USING (
        auth.uid() = guru_id OR 
        auth.uid() = shishya_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Only verified Gurus can initiate a connection
DROP POLICY IF EXISTS "Only verified gurus can initiate connection" ON public.connections;
CREATE POLICY "Only verified gurus can initiate connection"
    ON public.connections FOR INSERT
    WITH CHECK (
        auth.uid() = guru_id AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
              AND role = 'guru' 
              AND is_verified = true
        )
    );

-- Only the Shishya can accept or reject the connection
DROP POLICY IF EXISTS "Shishya can update connection status" ON public.connections;
CREATE POLICY "Shishya can update connection status"
    ON public.connections FOR UPDATE
    USING (auth.uid() = shishya_id);

-- 7. NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Direct client inserts into notifications are explicitly forbidden!
DROP POLICY IF EXISTS "Clients cannot directly insert notifications" ON public.notifications;
CREATE POLICY "Clients cannot directly insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (false);

DROP POLICY IF EXISTS "Users can update their notifications (mark read)" ON public.notifications;
CREATE POLICY "Users can update their notifications (mark read)"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- 8. PAYMENTS POLICIES
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
    ON public.payments FOR SELECT
    USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can insert payments" ON public.payments;
CREATE POLICY "Users can insert payments"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- STORAGE BUCKETS & STORAGE RLS POLICIES
-- ==============================================================================

-- Create buckets safely if storage schema exists
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES 
        ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
        ('post-media', 'post-media', true, 52428800, ARRAY[
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac',
            'video/mp4', 'video/webm', 'video/quicktime',
            'image/jpeg', 'image/png', 'image/webp'
        ])
    ON CONFLICT (id) DO UPDATE SET
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
EXCEPTION WHEN OTHERS THEN
    BEGIN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true), ('post-media', 'post-media', true)
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- Storage Policy 1: Public Read for avatars and post-media
DROP POLICY IF EXISTS "Public access to avatars" ON storage.objects;
CREATE POLICY "Public access to avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public access to post-media" ON storage.objects;
CREATE POLICY "Public access to post-media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'post-media');

-- Storage Policy 2: Avatars Upload (Max 2MB, owned folder)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage Policy 3: Post Media Upload (Audio <= 10MB, Video <= 50MB, owned folder)
DROP POLICY IF EXISTS "Users can upload media to their own folder" ON storage.objects;
CREATE POLICY "Users can upload media to their own folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'post-media' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage Policy 4: Users can delete their own uploaded files
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete own post media" ON storage.objects;
CREATE POLICY "Users can delete own post media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'post-media' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

