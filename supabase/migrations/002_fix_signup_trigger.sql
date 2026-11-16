-- ==============================================================================
-- SANGAM MIGRATION 002: Fix handle_new_user Trigger for Self-Registration
-- Ensures search_path is set to public so custom enums and tables resolve properly.
-- ==============================================================================

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
        -- Force shishya if anything else was passed
        assigned_role := 'shishya';
        initial_guru_status := 'none';
    END IF;

    -- Insert into public.profiles
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
    -- Ensure user creation never gets blocked
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Rebind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

