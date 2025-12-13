# Better Auth Troubleshooting Guide

## Common 500 Error Issues

### 1. Database Connection Issues

**Symptoms:** 500 errors on all `/api/auth/*` endpoints

**Solutions:**
- Verify `SUPABASE_DATABASE_URL` is set in `.env.local`
- The connection string should be in format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
- Get it from Supabase Dashboard → Settings → Database → Connection string → URI
- Make sure SSL is enabled (Supabase requires it)

**Test connection:**
```bash
# In your server terminal, you should see:
# "Database connection successful"
```

### 2. Database Schema Mismatch

**Symptoms:** 500 errors, especially on `get-session` or `sign-in` endpoints

**Solutions:**
- Ensure migration `013_better_auth_schema.sql` has been applied
- Better Auth expects specific column names. The migration uses quoted identifiers for camelCase columns
- If you see column name errors, you may need to adjust the schema

**Check if tables exist:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user', 'session', 'account', 'verification');
```

### 3. RLS (Row Level Security) Blocking Access

**Symptoms:** 500 errors, database queries fail

**Solution:**
- RLS is disabled in the migration for Better Auth tables
- Better Auth manages its own security
- If you need RLS, configure it to allow Better Auth's service role

### 4. Handler Configuration

**Symptoms:** 500 errors, requests hang

**Solution:**
- Ensure `toNodeHandler` is used (not `auth.handler` directly)
- `express.json()` must be mounted AFTER the Better Auth handler
- Check server logs for specific error messages

### 5. Environment Variables

**Check these are set in `.env.local`:**
```env
SUPABASE_DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APP_URL=http://localhost:5173
VITE_APP_URL=http://localhost:5173
```

## Debugging Steps

1. **Check server logs:**
   ```bash
   npm run dev:server
   ```
   Look for:
   - "Database connection successful" or connection errors
   - Specific error messages
   - Environment variable warnings

2. **Test database connection manually:**
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM "user" LIMIT 1;
   SELECT * FROM session LIMIT 1;
   ```

3. **Check browser console:**
   - Look for specific error messages
   - Check Network tab for request/response details

4. **Verify server is running:**
   - Better Auth server should be on `http://localhost:3001`
   - Vite dev server should be on `http://localhost:5173`
   - Vite proxies `/api/auth/*` to port 3001

## Quick Fixes

### If database connection fails:
1. Verify `SUPABASE_DATABASE_URL` format
2. Check Supabase allows connections from your IP
3. Ensure SSL is enabled in the Pool configuration

### If schema errors occur:
1. Re-run the migration: `supabase/migrations/013_better_auth_schema.sql`
2. Check if tables exist with correct column names
3. Verify quoted identifiers are used for camelCase columns

### If handler errors:
1. Restart both servers: `npm run dev:all`
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Check server terminal for error messages

