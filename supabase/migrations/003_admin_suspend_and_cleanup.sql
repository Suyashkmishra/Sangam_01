-- ==============================================================================
-- SANGAM MIGRATION 003: Admin Suspend / Reactivate & Demo Profile Alignment
-- ==============================================================================

-- 1. Add suspension fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);

-- 2. Extend privilege protection trigger to guard is_suspended & suspended_at
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_profile_updates()
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

    -- Check if current authenticated user has admin role
    SELECT (role = 'admin') INTO is_admin 
    FROM public.profiles 
    WHERE id = auth.uid();

    IF NOT COALESCE(is_admin, false) THEN
        IF (NEW.role IS DISTINCT FROM OLD.role) OR
           (NEW.is_verified IS DISTINCT FROM OLD.is_verified) OR
           (NEW.guru_status IS DISTINCT FROM OLD.guru_status) OR
           (NEW.is_suspended IS DISTINCT FROM OLD.is_suspended) OR
           (NEW.suspended_at IS DISTINCT FROM OLD.suspended_at) THEN
            RAISE EXCEPTION 'Unauthorized: Only admins can modify user role, verification, guru status, or suspension status.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Update Admin name and clear admin avatar_url (will use official logo)
UPDATE public.profiles
SET full_name = 'Sangam Admin',
    avatar_url = null
WHERE role = 'admin';

-- 4. Clear stock photo URLs for seeded demo users so Initials Avatar component displays
UPDATE public.profiles
SET avatar_url = null
WHERE id IN (
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000010'
);
