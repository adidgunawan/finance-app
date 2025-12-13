# Debugging Better Auth 500 Errors

## Current Status
- ✅ Database tables exist (verified with `npm run check:db`)
- ✅ Connection string is set correctly
- ❌ Getting 500 errors on `/api/auth/get-session` and `/api/auth/sign-in/social`

## Steps to Debug

### 1. Check Server Logs
When you run `npm run dev:server`, you should see:
- Server startup messages
- `[Better Auth] GET /get-session` or `[Better Auth] POST /sign-in/social` when requests come in
- Any error messages

**Please share the server terminal output** when you make a request.

### 2. Test Server Directly
Test if the server is responding:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test Better Auth endpoint
curl http://localhost:3001/api/auth/get-session
```

### 3. Common Issues

#### Issue: Server not running
**Solution:** Make sure `npm run dev:server` is running in a terminal

#### Issue: Database connection errors
**Check:** Look for "Database connection failed" in server logs
**Solution:** Verify `SUPABASE_DATABASE_URL` in `.env.local`

#### Issue: Handler errors
**Check:** Look for `[Better Auth] Handler error` in server logs
**Solution:** Share the error message and stack trace

#### Issue: Missing environment variables
**Check:** Server startup should show:
- `GOOGLE_CLIENT_ID: set` (if using Google OAuth)
- `SUPABASE_DATABASE_URL: set`

### 4. What to Share
When reporting the issue, please include:
1. **Server terminal output** (the full log when you start the server and make a request)
2. **Browser console errors** (the 500 error details)
3. **Environment check output** (from server startup)

This will help identify the exact cause of the 500 error.
