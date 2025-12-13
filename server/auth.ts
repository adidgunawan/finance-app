import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local first, then .env (local takes precedence)
dotenv.config({ path: resolve(__dirname, '../.env.local') })
dotenv.config({ path: resolve(__dirname, '../.env') })
import { betterAuth } from "better-auth"
import { Pool } from "pg"

// Create PostgreSQL connection pool for Supabase
// Note: Supabase requires SSL for direct database connections
const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL

if (!connectionString) {
  console.error('ERROR: SUPABASE_DATABASE_URL is not set in .env.local')
  console.error('Please add SUPABASE_DATABASE_URL to your .env.local file')
  process.exit(1)
}

// Validate connection string format
if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
  console.error('ERROR: SUPABASE_DATABASE_URL must start with postgresql:// or postgres://')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  // Supabase requires SSL for all connections
  ssl: {
    rejectUnauthorized: false
  }
})

// Test database connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

// Test database connection and verify tables exist
pool.query('SELECT NOW()')
  .then(async () => {
    console.log('Database connection successful')
    
    // Check if Better Auth tables exist
    const tables = ['user', 'session', 'account', 'verification']
    for (const table of tables) {
      try {
        const result = await pool.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [table === 'user' ? 'user' : table]
        )
        const exists = result.rows[0]?.exists
        if (exists) {
          console.log(`✓ Table "${table}" exists`)
        } else {
          console.error(`✗ Table "${table}" does NOT exist - run migration 013_better_auth_schema.sql`)
        }
      } catch (err: any) {
        console.error(`Error checking table "${table}":`, err.message)
      }
    }
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message)
    console.error('\nTroubleshooting:')
    console.error('1. Verify your connection string format:')
    console.error('   Direct connection: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres')
    console.error('   Session pooler: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres')
    console.error('2. If you see ENOTFOUND error, try using Session Pooler instead of Direct connection')
    console.error('3. Get the correct connection string from: Supabase Dashboard → Settings → Database → Connection string')
    console.error('4. Make sure your password is URL-encoded (replace special chars with %XX)')
    console.error('\nCurrent connection string (first 50 chars):', connectionString.substring(0, 50) + '...')
  })

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  baseURL: process.env.APP_URL || "http://localhost:5173",
  basePath: "/api/auth",
})

