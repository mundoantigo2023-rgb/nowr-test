-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    short_description TEXT,
    photos TEXT[] DEFAULT '{}',
    private_photos TEXT[] DEFAULT '{}',
    is_prime BOOLEAN DEFAULT false,
    prime_expiration_date TIMESTAMP WITH TIME ZONE,
    is_test_profile BOOLEAN DEFAULT false,
    age_verified BOOLEAN DEFAULT false,
    allow_highlight BOOLEAN DEFAULT true,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    hide_activity_status BOOLEAN DEFAULT false,
    intention_tags TEXT[] DEFAULT '{}',
    invisible_mode BOOLEAN DEFAULT false,
    last_active TIMESTAMP WITH TIME ZONE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    nowpick_active_until TIMESTAMP WITH TIME ZONE,
    nowpick_last_used TIMESTAMP WITH TIME ZONE,
    online_status BOOLEAN DEFAULT false,
    search_preference TEXT,
    visible_gender TEXT,
    PRIMARY KEY (id),
    UNIQUE (user_id)
);

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_a UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    chat_started_at TIMESTAMP WITH TIME ZONE,
    chat_expires_at TIMESTAMP WITH TIME ZONE
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    read BOOLEAN DEFAULT false,
    is_temporary BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    nowpik_image_url TEXT,
    nowpik_duration INTEGER,
    nowpik_viewed BOOLEAN DEFAULT false,
    nowpik_viewed_at TIMESTAMP WITH TIME ZONE
);

-- Create interests table
CREATE TABLE IF NOT EXISTS public.interests (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create blocks table
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    blocker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create album_access table
CREATE TABLE IF NOT EXISTS public.album_access (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create boosts table
CREATE TABLE IF NOT EXISTS public.boosts (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    boost_type TEXT NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create profile_views table
CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    viewer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    viewed_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create retention_notifications table
CREATE TABLE IF NOT EXISTS public.retention_notifications (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    cta_text TEXT NOT NULL,
    cta_path TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create screenshot_events table
CREATE TABLE IF NOT EXISTS public.screenshot_events (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add Indexes (Recommended for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_a ON public.matches(user_a);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON public.matches(user_b);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_interests_from_user_id ON public.interests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_interests_to_user_id ON public.interests(to_user_id);

-- Set up Row Level Security (RLS)
-- Note: Simplified policies for now. In a real scenario, you'd want granular control.

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenshot_events ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Allow access to own data or authenticated users generally - NEEDS REFINEMENT FOR PRODUCTION)

-- Profiles: Publicly readable (for social features), writable by owner
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Matches: Readable by participants
CREATE POLICY "Matches viewable by participants" ON public.matches FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "Matches insertable by authenticated" ON public.matches FOR INSERT WITH CHECK (auth.role() = 'authenticated'); -- Logic validation typically done in app/function

-- Messages: Readable by participants
CREATE POLICY "Messages viewable by participants" ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid()))
);
CREATE POLICY "Users can send messages to matches" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid()))
);

-- Interests
CREATE POLICY "Users can view interests sent or received" ON public.interests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can create interests" ON public.interests FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Blocks
CREATE POLICY "Users can view their blocks" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can create blocks" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Album Access
CREATE POLICY "Album access viewable by owner and requester" ON public.album_access FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = requester_id);
CREATE POLICY "Users can request access" ON public.album_access FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Owners can update status" ON public.album_access FOR UPDATE USING (auth.uid() = owner_id);

-- AUTOMATIC PROFILE CREATION TRIGGER
-- This function runs every time a new user executes "supabase.auth.signUp()"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, age, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', 'User'),
    COALESCE((new.raw_user_meta_data->>'age')::int, 18),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger itself
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
