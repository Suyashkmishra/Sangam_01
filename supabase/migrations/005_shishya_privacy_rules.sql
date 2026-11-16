-- Migration 005: Enforce role-based profile visibility, explore restrictions, and shishya privacy

-- 1. Profiles SELECT Policy:
-- Gurus and Admins can view all non-suspended profiles.
-- Shishyas and public can view:
--   a) Their own profile (auth.uid() = id)
--   b) Any non-suspended Guru or Admin profile
-- Shishyas CANNOT list other shishyas directly from profiles.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles view policy" ON public.profiles;

CREATE POLICY "Profiles view policy"
ON public.profiles FOR SELECT
USING (
    -- 1. Users can always view their own profile
    auth.uid() = id
    OR
    -- 2. Gurus and admins are viewable by everyone (if not suspended)
    (role IN ('guru', 'admin') AND is_suspended = false)
    OR
    -- 3. Gurus and admins can view any profile (if not suspended)
    (
        is_suspended = false
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('guru', 'admin')
        )
    )
);

-- 2. Security-Definer Function: get_explore_shishyas
-- Enforces on the server that only Gurus and Admins can list Shishyas.
CREATE OR REPLACE FUNCTION public.get_explore_shishyas()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role text;
BEGIN
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF caller_role = 'shishya' OR caller_role IS NULL THEN
        RAISE EXCEPTION 'Access Denied: Shishyas are not permitted to list fellow shishyas';
    END IF;
    
    RETURN QUERY
    SELECT * FROM public.profiles
    WHERE role = 'shishya' AND is_suspended = false
    ORDER BY created_at DESC;
END;
$$;

-- 3. Security-Definer Function: get_shishya_public_profile
-- Returns sanitized fields for shishya viewers (no bio, no city, no contacts).
CREATE OR REPLACE FUNCTION public.get_shishya_public_profile(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role text;
    target_rec public.profiles%ROWTYPE;
    result JSONB;
BEGIN
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    SELECT * INTO target_rec FROM public.profiles 
    WHERE id = target_user_id AND is_suspended = false;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- If caller is Guru, Admin, or the user themselves: return full profile
    IF caller_role IN ('guru', 'admin') OR auth.uid() = target_user_id OR target_rec.role != 'shishya' THEN
        result := jsonb_build_object(
            'id', target_rec.id,
            'full_name', target_rec.full_name,
            'role', target_rec.role,
            'avatar_url', target_rec.avatar_url,
            'city', target_rec.city,
            'bio', target_rec.bio,
            'languages', target_rec.languages,
            'is_verified', target_rec.is_verified,
            'guru_status', target_rec.guru_status
        );
    ELSE
        -- Shishya viewer viewing another shishya: ONLY initial avatar, name, role
        result := jsonb_build_object(
            'id', target_rec.id,
            'full_name', target_rec.full_name,
            'role', target_rec.role,
            'avatar_url', target_rec.avatar_url,
            'city', NULL,
            'bio', NULL,
            'languages', NULL,
            'is_verified', target_rec.is_verified,
            'guru_status', target_rec.guru_status
        );
    END IF;
    
    RETURN result;
END;
$$;
