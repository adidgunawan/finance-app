# Better Auth Implementation

This application now uses Better Auth for authentication with Google OAuth support.

## Quick Start

1. **Set up environment variables** (see BETTER_AUTH_SETUP.md)
2. **Run database migration**: Apply `supabase/migrations/013_better_auth_schema.sql` to your Supabase database
3. **Start development servers**:
   ```bash
   npm run dev:all
   ```

## Key Files

- `server/auth.ts` - Better Auth server configuration
- `server/index.ts` - Express server for Better Auth API routes
- `src/lib/auth-client.ts` - Better Auth React client
- `src/contexts/AuthContext.tsx` - Updated to use Better Auth
- `src/pages/Login.tsx` - Login page with Google OAuth button
- `supabase/migrations/013_better_auth_schema.sql` - Database schema for Better Auth

## Migration from Supabase Auth

The app has been migrated from Supabase Auth to Better Auth. The user object structure has changed:
- Old: `user.user_metadata.full_name`, `user.user_metadata.name`
- New: `user.name`, `user.email`

All components have been updated to use the new structure.

