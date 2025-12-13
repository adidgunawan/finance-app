# Better Auth with Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication using better-auth with Supabase.

## Prerequisites

1. A Supabase project
2. A Google Cloud Console project with OAuth 2.0 credentials

## Step 1: Set Up Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - For development: `http://localhost:3001/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
7. Copy the Client ID and Client Secret

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase (used by Vite client)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Database Connection (used by Better Auth server)
# Get this from Supabase Dashboard → Settings → Database → Connection string → URI
# 
# IMPORTANT: If you get "ENOTFOUND" DNS errors, use Session Pooler instead of Direct connection
# Direct connection (requires IPv6 support):
# SUPABASE_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
#
# Session Pooler (recommended if Direct connection fails):
# SUPABASE_DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
#
# Replace [PROJECT-REF] with your project reference (found in Supabase dashboard URL)
# Replace [REGION] with your project region (e.g., us-east-1, ap-southeast-1)
# Replace [PASSWORD] with your database password (URL-encode special characters)
SUPABASE_DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Better Auth (used by server)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APP_URL=http://localhost:5173
VITE_APP_URL=http://localhost:5173

# For production, update these:
# APP_URL=https://yourdomain.com
# VITE_APP_URL=https://yourdomain.com
```

**Note:** 
- Variables prefixed with `VITE_` are available to the client-side code
- Variables without `VITE_` prefix are only available to the server (Better Auth API)
- Both `APP_URL` and `VITE_APP_URL` should be set to `http://localhost:5173` for local development

**Important Notes:**
- The `.env.local` file should be in the root directory of your project
- Variables prefixed with `VITE_` are available to the client-side code (Vite automatically loads `.env.local`)
- Variables without `VITE_` prefix are only available to the server (Better Auth API server loads via `dotenv/config`)
- For the `SUPABASE_DATABASE_URL`, you can find it in your Supabase project settings under "Database" → "Connection string" → "URI"
- Make sure to replace `[PASSWORD]` and `[HOST]` with your actual Supabase database credentials
- Both `APP_URL` and `VITE_APP_URL` should be set to `http://localhost:5173` for local development

## Step 3: Run Database Migration

Apply the better-auth schema to your Supabase database:

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Run the migration file: `supabase/migrations/013_better_auth_schema.sql`

Or use the Supabase CLI:

```bash
supabase db push
```

## Step 4: Start the Development Servers

Run both the Vite dev server and the Better Auth API server:

```bash
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1: Vite dev server
npm run dev

# Terminal 2: Better Auth API server
npm run dev:server
```

## Step 5: Test the Authentication

1. Navigate to `http://localhost:5173/login`
2. Click "Continue with Google" to test Google OAuth
3. Or use email/password to test traditional login

## Database Schema

The migration creates the following tables:
- `user` - Stores user information
- `session` - Manages user sessions
- `account` - Links OAuth providers to users
- `verification` - Handles email verification tokens

All tables have Row Level Security (RLS) enabled for security.

## Troubleshooting

### Google OAuth redirect URI mismatch
- Ensure the redirect URI in Google Cloud Console matches exactly: `http://localhost:5173/api/auth/callback/google`
- Note: Vite proxies `/api/auth/*` requests to the Better Auth server on port 3001, so Google should redirect to `localhost:5173` (your Vite dev server)
- Check that both `APP_URL` and `VITE_APP_URL` in `.env.local` are set to `http://localhost:5173`

### Database connection issues
- Verify your `SUPABASE_DATABASE_URL` in `.env.local` is correct
- Ensure your Supabase project allows connections from your IP
- Check that the database user has proper permissions
- Make sure you're using the direct database connection string (not the Supabase API URL)

### Session not persisting
- Check that cookies are enabled in your browser
- Verify CORS settings in the server configuration
- Ensure the `baseURL` in auth client matches your app URL

## Production Deployment

1. Update environment variables with production values
2. Update Google OAuth redirect URIs to production domain
3. Ensure the Better Auth server is accessible at `/api/auth/*`
4. Set up proper SSL certificates
5. Configure CORS for your production domain
