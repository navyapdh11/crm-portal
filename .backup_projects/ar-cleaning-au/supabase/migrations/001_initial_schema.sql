-- AR Cleaning AU Database Migration
-- PostgreSQL + PostGIS for Uber-style location tracking

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'cleaner', 'admin')),
    avatar_url TEXT,
    stripe_customer_id TEXT UNIQUE,
    stripe_account_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CLEANERS TABLE
-- ============================================
CREATE TABLE public.cleaners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bio TEXT,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    total_jobs INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    service_radius_km DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
    current_location GEOGRAPHY(POINT, 4326),
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Spatial index for location queries
CREATE INDEX idx_cleaners_location ON public.cleaners USING GIST(current_location);
CREATE INDEX idx_cleaners_available ON public.cleaners(is_available, current_location) WHERE is_available = TRUE;

-- ============================================
-- SERVICES TABLE
-- ============================================
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'standard',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_active ON public.services(is_active) WHERE is_active = TRUE;

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.users(id),
    cleaner_id UUID REFERENCES public.cleaners(id),
    service_id UUID NOT NULL REFERENCES public.services(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    total_amount DECIMAL(10, 2) NOT NULL,
    cleaner_payout DECIMAL(10, 2),
    platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    notes TEXT,
    payment_intent_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_cleaner ON public.bookings(cleaner_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_scheduled ON public.bookings(scheduled_at);
CREATE INDEX idx_bookings_location ON public.bookings USING GIST(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- ============================================
-- CLEANER LOCATIONS TABLE (for real-time tracking)
-- ============================================
CREATE TABLE public.cleaner_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cleaner_id UUID NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    speed DECIMAL(5, 2) NOT NULL DEFAULT 0,
    heading DECIMAL(5, 2) NOT NULL DEFAULT 0,
    accuracy DECIMAL(5, 2) NOT NULL DEFAULT 10,
    geohash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for location queries
CREATE INDEX idx_cleaner_locations_location ON public.cleaner_locations USING GIST(location);
CREATE INDEX idx_cleaner_locations_cleaner ON public.cleaner_locations(cleaner_id, created_at DESC);
CREATE INDEX idx_cleaner_locations_geohash ON public.cleaner_locations(geohash);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaner_locations;

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id),
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'aud',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    payout_id TEXT,
    payout_amount DECIMAL(10, 2),
    payout_status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON public.payments(booking_id);
CREATE INDEX idx_payments_stripe ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to find nearby cleaners using PostGIS
CREATE OR REPLACE FUNCTION public.find_nearby_cleaners(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 20
)
RETURNS TABLE (
    cleaner_id UUID,
    user_id UUID,
    distance_km DOUBLE PRECISION,
    hourly_rate DECIMAL(10, 2),
    rating DECIMAL(3, 2),
    is_available BOOLEAN,
    total_jobs INTEGER,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS cleaner_id,
        c.user_id,
        ST_Distance(
            c.current_location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) / 1000 AS distance_km,
        c.hourly_rate,
        c.rating,
        c.is_available,
        c.total_jobs,
        c.is_verified
    FROM public.cleaners c
    WHERE c.is_available = TRUE
    AND c.current_location IS NOT NULL
    AND ST_DWithin(
        c.current_location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_km * 1000
    )
    ORDER BY distance_km ASC, c.rating DESC, c.total_jobs DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate geohash from location
CREATE OR REPLACE FUNCTION public.generate_geohash(
    longitude DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    precision INTEGER DEFAULT 7
)
RETURNS TEXT AS $$
DECLARE
    lat_range DOUBLE PRECISION := 90.0;
    lng_range DOUBLE PRECISION := 180.0;
    lat_mid DOUBLE PRECISION;
    lng_mid DOUBLE PRECISION;
    geohash TEXT := '';
    chars TEXT := '0123456789bcdefghjkmnpqrstuvwxyz';
    bit INTEGER;
    ch INTEGER := 0;
    i INTEGER := 0;
    is_even BOOLEAN := TRUE;
BEGIN
    FOR precision_count IN 1..precision LOOP
        FOR bit_pos IN 0..3 LOOP
            IF is_even THEN
                lng_mid := (lng_range + (-lng_range)) / 2;
                IF longitude >= lng_mid THEN
                    ch := ch | (1 << (3 - bit_pos));
                    lng_range := lng_mid;
                ELSE
                    lng_range := lng_mid;
                END IF;
            ELSE
                lat_mid := (lat_range + (-lat_range)) / 2;
                IF latitude >= lat_mid THEN
                    ch := ch | (1 << (3 - bit_pos));
                    lat_range := lat_mid;
                ELSE
                    lat_range := lng_mid;
                END IF;
            END IF;
            is_even := NOT is_even;
        END LOOP;
        geohash := geohash || substring(chars from ch + 1 for 1);
        ch := 0;
    END LOOP;
    RETURN geohash;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at on users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on cleaners
CREATE TRIGGER update_cleaners_updated_at
    BEFORE UPDATE ON public.cleaners
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on services
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on bookings
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on payments
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate geohash on cleaner_locations insert
CREATE OR REPLACE FUNCTION public.set_geohash_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    longitude DOUBLE PRECISION;
    latitude DOUBLE PRECISION;
BEGIN
    longitude := ST_X(NEW.location::geometry);
    latitude := ST_Y(NEW.location::geometry);
    NEW.geohash := public.generate_geohash(longitude, latitude, 7);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cleaner_locations_geohash
    BEFORE INSERT ON public.cleaner_locations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_geohash_on_insert();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaner_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Cleaners policies
CREATE POLICY "Anyone can view available cleaners" ON public.cleaners
    FOR SELECT USING (is_available = TRUE OR auth.uid() = user_id);

CREATE POLICY "Cleaners can update own profile" ON public.cleaners
    FOR UPDATE USING (auth.uid() = user_id);

-- Services policies
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = TRUE);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = customer_id OR auth.uid() IN (
        SELECT user_id FROM public.cleaners WHERE id = bookings.cleaner_id
    ));

CREATE POLICY "Users can create own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Cleaners can update assigned bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() IN (
        SELECT user_id FROM public.cleaners WHERE id = bookings.cleaner_id
    ));

-- Cleaner locations policies
CREATE POLICY "Anyone can view cleaner locations" ON public.cleaner_locations
    FOR SELECT USING (TRUE);

CREATE POLICY "Cleaners can insert own locations" ON public.cleaner_locations
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT user_id FROM public.cleaners WHERE id = cleaner_id
    ));

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() IN (
        SELECT customer_id FROM public.bookings WHERE id = payments.booking_id
        UNION
        SELECT user_id FROM public.cleaners c 
        JOIN public.bookings b ON b.cleaner_id = c.id 
        WHERE b.id = payments.booking_id
    ));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- VIEWS for P&L Tracking
-- ============================================

-- Cleaner P&L View
CREATE OR REPLACE VIEW public.cleaner_pnl AS
SELECT 
    c.id AS cleaner_id,
    c.user_id,
    COALESCE(SUM(b.cleaner_payout), 0) AS total_earnings,
    COALESCE(SUM(p.payout_amount), 0) AS total_payouts,
    COUNT(b.id) AS job_count,
    AVG(c.rating) AS avg_rating,
    DATE_TRUNC('month', b.created_at) AS period_start,
    (DATE_TRUNC('month', b.created_at) + INTERVAL '1 month')::date AS period_end
FROM public.cleaners c
LEFT JOIN public.bookings b ON b.cleaner_id = c.id AND b.status = 'completed'
LEFT JOIN public.payments p ON p.booking_id = b.id
GROUP BY c.id, c.user_id, DATE_TRUNC('month', b.created_at);

-- Platform P&L View
CREATE OR REPLACE VIEW public.platform_pnl AS
SELECT 
    COALESCE(SUM(b.total_amount), 0) AS total_revenue,
    COALESCE(SUM(b.cleaner_payout), 0) AS total_payouts,
    COALESCE(SUM(b.platform_fee), 0) AS total_fees,
    COALESCE(SUM(b.total_amount), 0) - COALESCE(SUM(b.cleaner_payout), 0) AS net_profit,
    COUNT(b.id) AS booking_count,
    DATE_TRUNC('month', b.created_at) AS period_start,
    (DATE_TRUNC('month', b.created_at) + INTERVAL '1 month')::date AS period_end
FROM public.bookings b
WHERE b.status IN ('completed', 'in_progress')
GROUP BY DATE_TRUNC('month', b.created_at);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert sample services
INSERT INTO public.services (name, description, base_price, duration_minutes, category) VALUES
    ('Standard Clean', 'Regular house cleaning including dusting, vacuuming, and mopping', 89.00, 120, 'standard'),
    ('Deep Clean', 'Thorough cleaning of all areas including hard-to-reach spots', 149.00, 180, 'deep'),
    ('Move In/Out Clean', 'Complete cleaning for property transitions', 199.00, 240, 'special'),
    ('Office Clean', 'Professional office and workspace cleaning', 119.00, 90, 'commercial'),
    ('Window Clean', 'Interior and exterior window cleaning', 79.00, 60, 'add-on'),
    ('Carpet Clean', 'Professional carpet cleaning and stain removal', 99.00, 90, 'add-on'),
    ('End of Lease Clean', 'Bond-back guaranteed end of lease cleaning', 249.00, 300, 'special'),
    ('Airbnb Turnover', 'Quick turnover cleaning for short-term rentals', 129.00, 90, 'special');

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    );
    
    -- If role is cleaner, create a cleaner profile
    IF NEW.raw_user_meta_data->>'role' = 'cleaner' THEN
        INSERT INTO public.cleaners (user_id, hourly_rate)
        VALUES (NEW.id, 30.00);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth';
COMMENT ON TABLE public.cleaners IS 'Cleaner profiles with location and availability';
COMMENT ON TABLE public.services IS 'Available cleaning services';
COMMENT ON TABLE public.bookings IS 'Booking records linking customers, cleaners, and services';
COMMENT ON TABLE public.cleaner_locations IS 'Real-time GPS location history for cleaners';
COMMENT ON TABLE public.payments IS 'Payment records with Stripe integration';
COMMENT ON TABLE public.notifications IS 'User notifications for real-time updates';
COMMENT ON FUNCTION public.find_nearby_cleaners IS 'Find available cleaners within a radius using PostGIS';
