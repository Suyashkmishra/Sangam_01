-- Migration 004: Block admin users from creating posts via RLS and DB trigger

-- 1. Update RLS policy for post inserts: Only non-suspended gurus and shishyas can create posts
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

-- 2. Add database trigger enforcing that admins cannot insert posts
CREATE OR REPLACE FUNCTION public.check_post_author_role()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = NEW.author_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Admins cannot create posts';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_post_author_role ON public.posts;
CREATE TRIGGER trg_check_post_author_role
    BEFORE INSERT ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.check_post_author_role();
