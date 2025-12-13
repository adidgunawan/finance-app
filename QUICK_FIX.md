# Quick Fix for 500 Errors

## The Problem
The Better Auth server is **not running** on port 3001. That's why you're getting 500 errors.

## Solution

### Step 1: Start the Better Auth Server

You need to run the server. You have two options:

**Run everything with one command:**
```bash
npm run dev
```

This starts both:
- Vite dev server (port 5173)
- Better Auth server (port 3001)

**Or run servers separately (if needed):**

Terminal 1 - Vite only:
```bash
npm run dev:vite
```

Terminal 2 - Better Auth only:
```bash
npm run dev:server
```
### Step 2: Verify Server is Running

After starting, you should see in the terminal:
```
Better Auth server running on http://localhost:3001
Database connection successful
✓ Table "user" exists
✓ Table "session" exists
✓ Table "account" exists
✓ Table "verification" exists
```

### Step 3: Test the Server

Open a new terminal and test:
```bash
curl http://localhost:3001/health
```

You should get: `{"status":"ok","timestamp":"..."}`

### Step 4: Check for Errors

If the server doesn't start or shows errors, check:

1. **Environment variables** - Make sure `.env.local` has:
   ```env
   SUPABASE_DATABASE_URL=postgresql://...
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   APP_URL=http://localhost:5173
   ```

2. **Database connection** - Look for "Database connection failed" in the logs

3. **Port conflicts** - Make sure port 3001 is not already in use

### Step 5: Once Server is Running

After the server starts successfully:
1. Refresh your browser
2. The 500 errors should stop
3. Check the server terminal for `[Better Auth]` log messages when you make requests

## Still Getting 500 Errors?

If the server is running but you still get 500 errors:

1. **Check server terminal logs** - Look for `[Better Auth] Handler error` messages
2. **Share the error logs** - Copy the full error message and stack trace
3. **Check database** - Run `npm run check:db` to verify tables exist

