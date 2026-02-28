# 🗄️ Supabase Database Setup Guide

## Overview

This guide covers the complete Supabase setup for **Odyssey Luxe**, including authentication and database tables for user profiles and saved itineraries.

---

## 📋 Prerequisites

1. A Supabase account ([Sign up here](https://app.supabase.com))
2. A new Supabase project created
3. Your Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

---

## 🔑 Step 1: Get Your Supabase Credentials

1. Go to [your Supabase dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** → **API**
4. Copy the following values to your `.env` file:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (optional, for backend only)

---

## 📊 Step 2: Create Database Tables

Go to your Supabase project dashboard and open the **SQL Editor**. Run the following SQL commands to create the necessary tables:

### 1. User Profiles Table

```sql
-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 2. Itineraries Table

```sql
-- Create itineraries table
CREATE TABLE public.itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget VARCHAR(50),
  preferences TEXT,
  trip_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Create policies for itineraries
CREATE POLICY "Users can view their own itineraries" ON public.itineraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create itineraries" ON public.itineraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries" ON public.itineraries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries" ON public.itineraries
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX itineraries_user_id_idx ON public.itineraries(user_id);
CREATE INDEX itineraries_created_at_idx ON public.itineraries(created_at DESC);
```

---

## ✅ Step 3: Configure Environment Variables

Update your `.env` file in the project root with your Supabase credentials:

```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:9002

# Token Tracking (optional)
TOKEN_TRACKER_SECRET=your_secret_key_here
```

---

## 🔐 Step 4: Enable Authentication Methods

In your Supabase project:

1. Go to **Authentication** → **Providers**
2. Enable **Email** (enabled by default)
3. Optionally enable other providers (Google, GitHub, etc.)

### Email Configuration (Recommended)

1. Go to **Authentication** → **Email Templates**
2. Customize the email confirmation template if desired
3. Go to **Authentication** → **Providers** → **Email**
4. Set confirmation settings as needed

---

## 🧪 Step 5: Test the Setup

### Test User Registration
1. Go to `http://localhost:9002/auth/signup`
2. Create a new account with email and password
3. Verify that the user profile is created in Supabase

### Test Itinerary Saving
1. After logging in, go to `/ai-architect`
2. Fill in the form and generate an itinerary
3. Click **Save Trip**
4. Go to `/my-trips` to verify the itinerary is saved

---

## 📱 Features Enabled

### Authentication
- ✅ Email/password registration and login
- ✅ Session management
- ✅ Protected routes
- ✅ Automatic user profile creation

### User Profile Management
- ✅ View profile information
- ✅ Edit full name and bio
- ✅ Display email and account details

### Itinerary Management
- ✅ Save generated itineraries to database
- ✅ View all saved trips
- ✅ Delete trips
- ✅ View trip details with timeline
- ✅ Download PDF exports

---

## 🐛 Troubleshooting

### "Invalid login credentials" error
- Double-check your email and password
- Ensure email confirmation is enabled in Supabase

### "Itinerary save fails"
- Verify you're logged in
- Check that the `itineraries` table exists in your database
- Look at browser console for specific error messages

### "User profile not showing"
- Ensure the `user_profiles` table exists
- Check Row Level Security policies
- Verify the trigger is creating profiles on signup

### "Supabase connection error"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the **anon** key, not the service role key
- Ensure variables are in `.env` (not `.env.local`)

---

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Tables Guide](https://supabase.com/docs/guides/database)

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check browser console for error messages
4. Review server logs with `npm run dev`

---

## 📌 Step 6: Run the Setup Script

Run the following script to drop existing tables and functions, then recreate them:

-- ============================================
-- 1. DROP EXISTING TABLES AND FUNCTIONS
-- ============================================
DROP TABLE IF EXISTS public.itineraries CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- ============================================
-- 2. CREATE USER PROFILES TABLE
-- ============================================
CREATE TABLE public.user_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. CREATE ITINERARIES TABLE
-- ============================================
CREATE TABLE public.itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget VARCHAR(50),
  preferences TEXT,
  trip_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Create policies for itineraries
CREATE POLICY "Users can view their own itineraries" ON public.itineraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create itineraries" ON public.itineraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries" ON public.itineraries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries" ON public.itineraries
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX itineraries_user_id_idx ON public.itineraries(user_id);
CREATE INDEX itineraries_created_at_idx ON public.itineraries(created_at DESC);

-- ============================================
-- 4. CREATE AUTO-INSERT TRIGGER FOR NEW USERS
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. VERIFY SETUP (Optional - Run to confirm)
-- ============================================
-- Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'itineraries');

-- Check policies
SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('user_profiles', 'itineraries');
