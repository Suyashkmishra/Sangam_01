-- ==============================================================================
-- SANGAM MIGRATION 006: Per-Post Moderation, Admin Actions Audit & Notifications
-- ==============================================================================

-- 1. POSTS TABLE: Moderation & Status Tracking
DO $$ BEGIN
    CREATE TYPE post_status AS ENUM ('published', 'suspended', 'pending_review');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS status post_status NOT NULL DEFAULT 'published',
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);

-- Ensure all existing posts are marked 'published'
UPDATE public.posts 
SET status = 'published' 
WHERE status IS NULL;

-- 2. NOTIFICATIONS TABLE: Decouple from post deletion & add moderation details
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_post_id_fkey;
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS post_title TEXT,
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS message TEXT;

-- Extend notification_type enum with post moderation lifecycle types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'post_suspended';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'post_deleted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'post_resubmitted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'post_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'post_rejected';

-- 3. ADMIN_ACTIONS TABLE: Audit Trail for All Moderation & Verification Actions
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'post', 'user', 'guru'
    target_id TEXT NOT NULL,
    target_name TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON public.admin_actions(target_type, target_id);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_actions" ON public.admin_actions;
CREATE POLICY "Admins can view admin_actions"
    ON public.admin_actions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. TRIGGER: Prevent non-admins from modifying moderation fields
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
